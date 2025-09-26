import { Address, beginCell, toNano, Cell, SendMode } from '@ton/core';
import { TonClient, WalletContractV5R1, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { CellJMPIFactory } from '../../build/CellJMPI/CellJMPI_CellJMPIFactory';
import { CellJMPIEscrow } from '../../build/CellJMPI/CellJMPI_CellJMPIEscrow';
import { JettonMaster } from '@ton/ton';
import { keccak256 } from 'js-sha3';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config();

function createTimeLockStateJS(data: {
    srcWithdrawal: bigint;
    srcPublicWithdrawal: bigint;
    srcCancellation: bigint;
    srcPublicCancellation: bigint;
    dstWithdrawal: bigint;
    dstPublicWithdrawal: bigint;
    dstCancellation: bigint;
}): bigint {
    let init = BigInt(0);
    init |= data.srcWithdrawal << BigInt(0 * 32);
    init |= data.srcPublicWithdrawal << BigInt(1 * 32);
    init |= data.srcCancellation << BigInt(2 * 32);
    init |= data.srcPublicCancellation << BigInt(3 * 32);
    init |= data.dstWithdrawal << BigInt(4 * 32);
    init |= data.dstPublicWithdrawal << BigInt(5 * 32);
    init |= data.dstCancellation << BigInt(6 * 32);
    return init;
}

function parseEscrowCreatedEvent(messageBody: Cell): any {
    try {
        const slice = messageBody.beginParse();
        const opcode = slice.loadUint(32);

        if (opcode !== 0xafe72100) {
            return null;
        }

        const finalitySeconds = slice.loadUintBig(32);
        const withdrawalSeconds = slice.loadUintBig(32);
        const orderId = slice.loadUintBig(64);
        const hashLock = slice.loadUintBig(256);
        const taker = slice.loadAddress();
        const maker = slice.loadAddress();
        const amount = slice.loadUintBig(256);
        const extraData = slice.loadRef();
        const escrow = slice.loadAddress();

        return {
            finalitySeconds,
            withdrawalSeconds,
            orderId,
            hashLock,
            taker,
            maker,
            amount,
            extraData,
            escrow,
        };
    } catch (error) {
        console.log('Failed to parse EscrowCreated event:', error);
        return null;
    }
}

function parseExtraData(extraDataCell: Cell): any {
    try {
        const slice = extraDataCell.beginParse();

        if (slice.remainingBits >= 576) {
            // 160 + 160 + 256 = 576 bits
            const ethAddress1 = slice.loadUintBig(160);
            const ethAddress2 = slice.loadUintBig(160);
            const randomData = slice.loadUintBig(256);

            return {
                ethAddress1: '0x' + ethAddress1.toString(16).padStart(40, '0'),
                ethAddress2: '0x' + ethAddress2.toString(16).padStart(40, '0'),
                randomData: '0x' + randomData.toString(16).padStart(64, '0'),
            };
        }
        return null;
    } catch (error) {
        console.log('Failed to parse extraData:', error);
        return null;
    }
}

async function main() {
    console.log('CellJMPI Factory Testing\n');

    const FACTORY_ADDRESS = 'EQAaV93zFP0O6AjtjOGVWQvsknR3EfGm6EA3FLh8KE2vH5lm';
    const USDT_MASTER = Address.parse('EQBX6K9aXVl3nXINCyPPL86C4ONVmQ8vK360u6dykFKXpHCa');
    const USDT_AMOUNT = 1;

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

    const factoryAddress = Address.parse(FACTORY_ADDRESS);
    const factory = client.open(CellJMPIFactory.fromAddress(factoryAddress));

    const takerAddress = walletAddress;
    const makerAddress = walletAddress;
    const orderId = BigInt(73);
    const secretBytes = randomBytes(32);

    // Convert to hex string for printing
    const secretHex = '0x' + secretBytes.toString('hex');
    console.log('Random secret (hex):', secretHex);

    // Hash the bytes directly
    const hashLock = BigInt('0x' + keccak256(secretBytes));
    console.log('Hash lock:', hashLock.toString(16));

    const dstChain = 0;

    console.log('Order ID:', orderId.toString());
    console.log('Hash Lock:', '0x' + hashLock.toString(16));

    const timeLockData = {
        srcWithdrawal: BigInt(0),
        srcPublicWithdrawal: BigInt(0),
        srcCancellation: BigInt(0),
        srcPublicCancellation: BigInt(0),
        dstWithdrawal: BigInt(0),
        dstPublicWithdrawal: BigInt(500),
        dstCancellation: BigInt(900),
    };

    const timeLockState = createTimeLockStateJS(timeLockData);
    console.log('TimeLock State:', '0x' + timeLockState.toString(16));

    const escrowAddress = await factory.getGetEscrowAddress(orderId, hashLock, BigInt(dstChain), makerAddress);
    console.log('Escrow Address:', escrowAddress.toString());

    const usdtContract = client.open(JettonMaster.create(USDT_MASTER));
    const escrowJettonWallet = await usdtContract.getWalletAddress(escrowAddress);
    const yourUsdtWallet = await usdtContract.getWalletAddress(walletAddress);

    const ethAddress1 = BigInt('0x51aa94BC132221A1924977499ceb50A8FE0CfAfe');
    const ethAddress2 = BigInt('0x51aa94BC132221A1924977499ceb50A8FE0CfAfe');
    const randomData = BigInt(
        '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    );

    const extraData = beginCell()
        .storeUint(ethAddress1, 160)
        .storeUint(ethAddress2, 160)
        .storeUint(randomData, 256)
        .endCell();

    console.log('ETH Address 1:', '0x' + ethAddress1.toString(16).padStart(40, '0'));
    console.log('ETH Address 2:', '0x' + ethAddress2.toString(16).padStart(40, '0'));
    console.log('Random Data:', '0x' + randomData.toString(16).padStart(64, '0'));

    const addressesCell = beginCell()
        .storeUint(timeLockState, 256)
        .storeAddress(takerAddress)
        .storeAddress(escrowJettonWallet)
        .storeRef(extraData)
        .endCell();

    const mainCell = beginCell()
        .storeUint(0, 32) // finalitySeconds
        .storeUint(dstChain, 16) // dstChain
        .storeUint(orderId, 256) // orderId
        .storeUint(hashLock, 256) // hashLock
        .storeRef(addressesCell)
        .endCell();

    const jettonTransferBody = beginCell()
        .storeUint(0xf8a7ea5, 32) // JettonTransfer op
        .storeUint(0, 64) // queryId
        .storeCoins(USDT_AMOUNT) // amount
        .storeAddress(factoryAddress) // destination
        .storeAddress(walletAddress) // responseDestination
        .storeBit(0) // customPayload null
        .storeCoins(toNano('0.4')) // forwardTonAmount
        .storeBit(1) // forwardPayload present
        .storeRef(mainCell)
        .endCell();

    console.log('\nSending transaction...');

    try {
        const seqno = await walletContract.getSeqno();

        const transfer = walletContract.createTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: yourUsdtWallet,
                    value: toNano('0.51'),
                    body: jettonTransferBody,
                }),
            ],
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });

        await walletContract.send(transfer);

        // Wait for confirmation
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
            console.log('Transaction timeout. Check tonscan manually.');
            return;
        }

        console.log('Transaction confirmed!\n');

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Fetch transaction details to get actual hash
        console.log('Fetching transaction details...');
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
            } else {
                console.log('Could not find transaction details');
            }
        } catch (error) {
            console.log('Could not fetch transaction details:', error);
        }

        // Check escrow state
        console.log('Checking escrow state...');
        try {
            const escrow = client.open(CellJMPIEscrow.fromAddress(escrowAddress));
            const isInitialized = await escrow.getIsInitialized();
            console.log('Escrow Initialized:', isInitialized);

            if (isInitialized) {
                const escrowData = await escrow.getGetData();
                console.log('\nEscrow Data:');
                console.log('Order ID:', escrowData.orderId.toString());
                console.log('Hash Lock:', '0x' + escrowData.hashLock.toString(16));
                console.log('DST Chain:', escrowData.dstChain.toString());
                console.log('Finality Seconds:', escrowData.finalitySeconds.toString());
                console.log('Amount:', escrowData.amount.toString());
                console.log('Taker:', escrowData.taker?.toString() || 'null');
                console.log('Maker:', escrowData.maker?.toString() || 'null');
                console.log('TimeLock State:', '0x' + escrowData.timeLockState.toString(16));
            }
        } catch (error) {
            console.log('Could not read escrow state:', error);
        }
    } catch (error) {
        console.error('Failed to create escrow:', error);
    }
}

main().catch(console.error);
