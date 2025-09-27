import { Address, beginCell, toNano, SendMode } from '@ton/core';
import { TonClient, WalletContractV5R1, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { Escrow } from '../../build/EscrowFactory/EscrowFactory_Escrow';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log(' Escrow Cancellation Script\n');

    // Configuration - Replace these values
    const ESCROW_ADDRESS = 'EQAfUzA_5vwaKMPi-w7hDsOJT7ea0B5CT2Oo0Zyr1ZXFXEsq';

    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) {
        console.error('MNEMONIC environment variable is required');
        process.exit(1);
    }

    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY,
    });

    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
    const wallet = WalletContractV5R1.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });
    const walletContract = client.open(wallet);
    const walletAddress = wallet.address;

    console.log('Wallet Address:', walletAddress.toString());

    const balance = await walletContract.getBalance();
    console.log('Wallet Balance:', (balance / 1000000000n).toString(), 'TON');

    if (balance < toNano('0.2')) {
        console.warn('Low wallet balance. Make sure you have enough TON for fees.');
    }

    const escrowAddress = Address.parse(ESCROW_ADDRESS);
    const escrow = client.open(Escrow.fromAddress(escrowAddress));

    console.log('Escrow Address:', escrowAddress.toString());
    console.log('Canceller:', walletAddress.toString());

    // Check escrow state before cancellation
    console.log('\nChecking escrow state...');
    try {
        const isInitialized = await escrow.getIsInitialized();
        console.log('Initialized:', isInitialized);

        if (isInitialized) {
            const data = await escrow.getGetData();
            console.log('Amount:', data.amount.toString());
            console.log('Taker:', data.taker?.toString() || 'null');
            console.log('Maker:', data.maker?.toString() || 'null');
            console.log('Hash Lock:', '0x' + data.hashLock.toString(16));
            console.log('Finality Seconds:', data.finalitySeconds.toString());
            console.log('TimeLock State:', '0x' + data.timeLockState.toString(16));

            if (data.maker && !data.maker.equals(walletAddress)) {
                console.warn('Warning: You are not the maker. Only the maker can cancel the escrow.');
                console.log('Maker:', data.maker.toString());
                console.log('Your address:', walletAddress.toString());
            }
        } else {
            console.error('Escrow not initialized yet');
            process.exit(1);
        }
    } catch (error) {
        console.log('Could not fetch escrow state, proceeding anyway...');
        console.log('Error:', error);
    }

    // Create cancellation message
    console.log('\nPreparing cancellation transaction...');
    const cancelMessage = beginCell()
        .storeUint(0x368dde63, 32) // op code for Cancel
        .storeUint(0, 64) // query_id
        .endCell();

    console.log('Cancel OpCode: 0x368dde63');

    try {
        const seqno = await walletContract.getSeqno();
        console.log('Current seqno:', seqno);

        const transfer = walletContract.createTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: escrowAddress,
                    value: toNano('0.15'), // Gas for cancellation + jetton transfer
                    body: cancelMessage,
                }),
            ],
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });

        console.log('\nSending cancellation transaction...');
        await walletContract.send(transfer);

        console.log('Cancellation transaction sent!');
        console.log('Transaction should return tokens to maker:', walletAddress.toString());

        // Wait for transaction confirmation
        let currentSeqno = seqno;
        let attempts = 0;
        const maxAttempts = 60;

        while (currentSeqno === seqno && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            currentSeqno = await walletContract.getSeqno();
            attempts++;

            if (attempts % 10 === 0) {
                console.log(`Waiting... ${attempts * 1.5}s elapsed`);
            }
        }

        if (currentSeqno === seqno) {
            console.log('Transaction confirmation timeout. Check tonscan manually.');
            return;
        }

        console.log('Transaction confirmed!');

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Fetch transaction details
        console.log('\nFetching transaction details...');

        try {
            const transactions = await client.getTransactions(walletAddress, { limit: 5 });

            const ourTransaction = transactions.find(
                (tx) =>
                    tx.description.type === 'generic' &&
                    tx.description.computePhase.type === 'vm' &&
                    tx.now > Date.now() / 1000 - 300,
            );

            if (ourTransaction) {
                const actualTxHash = ourTransaction.hash().toString('hex');
                console.log('\nTransaction Details:');
                console.log('Hash:', actualTxHash);
                console.log('LT:', ourTransaction.lt.toString());
                console.log('Total Fees:', ourTransaction.totalFees.coins.toString(), 'nanoTON');
                console.log('Tonscan URL:', `https://tonscan.org/tx/${actualTxHash}`);

                // Check for outgoing messages
                if (ourTransaction.outMessages && ourTransaction.outMessages.size > 0) {
                    console.log('\nOutgoing Messages:');
                    let messageIndex = 0;

                    for (const [key, message] of ourTransaction.outMessages) {
                        messageIndex++;
                        console.log(`\nMessage ${messageIndex}:`);
                        console.log('To:', message.info.dest?.toString() || 'unknown');

                        if (message.body && message.body.bits.length > 0) {
                            try {
                                const slice = message.body.beginParse();
                                if (slice.remainingBits >= 32) {
                                    const opcode = slice.loadUint(32);
                                    console.log('Opcode:', '0x' + opcode.toString(16));

                                    switch (opcode) {
                                        case 0x178d4519:
                                            console.log('Type: Jetton Internal Transfer');
                                            break;
                                        case 0x7362d09c:
                                            console.log('Type: Jetton Transfer Notification');
                                            break;
                                        case 0x05138d91:
                                            console.log('Type: Jetton Burn Notification');
                                            break;
                                        default:
                                            console.log('Type: Unknown');
                                    }
                                }
                            } catch (e) {
                                console.log('Body:', message.body.bits.length, 'bits (unable to parse)');
                            }
                        }
                    }
                } else {
                    console.log('\nNo outgoing messages found');
                }

                // Check escrow contract events
                console.log('\nChecking escrow contract for events...');
                try {
                    const escrowTransactions = await client.getTransactions(escrowAddress, { limit: 5 });

                    const recentEscrowTx = escrowTransactions.find(
                        (tx) => tx.now > Date.now() / 1000 - 300 && tx.outMessages.size > 0,
                    );

                    if (recentEscrowTx) {
                        console.log('Escrow Contract Events:');
                        let msgIndex = 0;

                        for (const [key, message] of recentEscrowTx.outMessages) {
                            msgIndex++;
                            console.log(`\nEscrow Message ${msgIndex}:`);
                            console.log('To:', message.info.dest?.toString() || 'unknown');

                            if (message.body && message.body.bits.length > 0) {
                                try {
                                    const slice = message.body.beginParse();
                                    if (slice.remainingBits >= 32) {
                                        const opcode = slice.loadUint(32);
                                        console.log('Opcode:', '0x' + opcode.toString(16));

                                        // Check for cancellation-related events
                                        switch (opcode) {
                                            case 0x368dde63:
                                                console.log('Type: Cancellation Event');
                                                break;
                                            case 0x178d4519:
                                                console.log('Type: Jetton Internal Transfer (Refund)');
                                                break;
                                            default:
                                                console.log('Type: Unknown');
                                        }
                                    }
                                } catch (parseError) {
                                    console.log('Body:', message.body.bits.length, 'bits (unable to parse)');
                                }
                            }
                        }
                    } else {
                        console.log('No recent escrow transactions found');
                    }
                } catch (e) {
                    console.log('Could not fetch escrow contract events');
                }

                console.log('\nCancellation process completed!');
                console.log('Check your jetton wallet balance to confirm tokens were returned.');
            } else {
                console.log('Could not find transaction details');
            }
        } catch (error) {
            console.log('Could not fetch transaction details:', error);
        }
    } catch (error) {
        console.error('Failed to send cancellation transaction:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
