import { Address, Cell } from '@ton/core';
import { TonClient } from '@ton/ton';
import * as dotenv from 'dotenv';

dotenv.config();

function parseEscrowCreatedEvent(messageBody: Cell): any {
    try {
        const slice = messageBody.beginParse();

        // For external messages, there might not be an opcode at the beginning
        // Let's try to parse directly as the event structure
        console.log('Parsing event, remaining bits:', slice.remainingBits);

        if (slice.remainingBits < 32) {
            console.log('Not enough bits for opcode');
            return null;
        }

        const opcode = slice.loadUint(32);
        console.log('Found opcode:', '0x' + opcode.toString(16), 'Expected: 0xafe72100');

        if (opcode !== 0xafe72100) {
            return null;
        }

        console.log('Opcode matches! Parsing event fields...');
        console.log('Remaining bits after opcode:', slice.remainingBits);

        const finalitySeconds = slice.loadUintBig(32);
        console.log('Parsed finalitySeconds:', finalitySeconds.toString());

        const timeLockState = slice.loadUintBig(256);
        console.log('Parsed timeLockState:', '0x' + timeLockState.toString(16));

        const dstChain = slice.loadUintBig(16);
        console.log('Parsed dstChain:', dstChain.toString());

        const orderId = slice.loadUintBig(64);
        console.log('Parsed orderId:', orderId.toString());

        const hashLock = slice.loadUintBig(256);
        console.log('Parsed hashLock:', '0x' + hashLock.toString(16));

        console.log('Remaining bits before addresses:', slice.remainingBits);

        const taker = slice.loadAddress();
        console.log('Parsed taker:', taker.toString());

        const maker = slice.loadAddress();
        console.log('Parsed maker:', maker.toString());

        const amount = slice.loadUintBig(256);
        console.log('Parsed amount:', amount.toString());

        console.log('Remaining refs:', slice.remainingRefs);
        const extraData = slice.loadRef();
        console.log('Parsed extraData ref');

        console.log('Remaining bits before escrow address:', slice.remainingBits);
        const escrow = slice.loadAddress();
        console.log('Parsed escrow:', escrow.toString());

        return {
            finalitySeconds,
            timeLockState,
            dstChain,
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
        console.log('Error details:', error);
        return null;
    }
}

function parseExtraData(extraDataCell: Cell): any {
    try {
        const slice = extraDataCell.beginParse();

        if (slice.remainingBits >= 576) {
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

async function findEscrowEvents(factoryAddress: Address, limit: number = 2) {
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY,
    });

    console.log('Searching for EscrowCreated events...');
    console.log('Factory Address:', factoryAddress.toString());
    console.log('Checking last', limit, 'transactions\n');

    try {
        const factoryTransactions = await client.getTransactions(factoryAddress, { limit });

        let foundEvents = 0;

        for (let i = 0; i < factoryTransactions.length; i++) {
            const tx = factoryTransactions[i];
            console.log(`Transaction ${i + 1}/${factoryTransactions.length}:`);
            console.log('  Hash:', tx.hash().toString('hex'));
            console.log('  Time:', new Date(tx.now * 1000).toISOString());
            console.log('  LT:', tx.lt.toString());
            console.log('  Outgoing messages:', tx.outMessages.size);

            if (tx.outMessages.size > 0) {
                let messageIndex = 0;
                for (const [key, message] of tx.outMessages) {
                    messageIndex++;
                    console.log(`\n  Message ${messageIndex}:`);
                    console.log('    To:', message.info.dest?.toString() || 'external');
                    console.log('    Type:', message.info.type);

                    if (message.body && message.body.bits.length > 0) {
                        console.log('    Body bits:', message.body.bits.length);

                        try {
                            // First, let's see what we have
                            console.log('    Message body bits:', message.body.bits.length);
                            console.log('    Message body refs:', message.body.refs.length);

                            // For external messages, try parsing without expecting internal message structure
                            if (message.info.type === 'external-out') {
                                console.log('    This is an external-out message (event)');

                                const eventData = parseEscrowCreatedEvent(message.body);

                                if (eventData) {
                                    foundEvents++;
                                    console.log('\n    🎉 ESCROW CREATED EVENT FOUND! 🎉');
                                    console.log('    =====================================');
                                    console.log('    Finality Seconds:', eventData.finalitySeconds.toString());
                                    console.log('    TimeLock State:', '0x' + eventData.timeLockState.toString(16));
                                    console.log('    DST Chain:', eventData.dstChain.toString());
                                    console.log('    Order ID:', eventData.orderId.toString());
                                    console.log('    Hash Lock:', '0x' + eventData.hashLock.toString(16));
                                    console.log('    Taker:', eventData.taker.toString());
                                    console.log('    Maker:', eventData.maker.toString());
                                    console.log('    Amount:', eventData.amount.toString());
                                    console.log('    Escrow:', eventData.escrow.toString());

                                    // Parse extraData
                                    const extraDataParsed = parseExtraData(eventData.extraData);
                                    if (extraDataParsed) {
                                        console.log('\n    ExtraData:');
                                        console.log('      ETH Address 1:', extraDataParsed.ethAddress1);
                                        console.log('      ETH Address 2:', extraDataParsed.ethAddress2);
                                        console.log('      Random Data:', extraDataParsed.randomData);
                                    } else {
                                        console.log('    ExtraData: Could not parse');
                                    }
                                    console.log('    =====================================\n');
                                } else {
                                    console.log('    Not an EscrowCreated event');
                                }
                            } else {
                                // For internal messages, try to peek at the opcode
                                const slice = message.body.beginParse();
                                if (slice.remainingBits >= 32) {
                                    const opcode = slice.loadUint(32);
                                    console.log('    Opcode:', '0x' + opcode.toString(16));

                                    // Still try to parse as event in case it's structured differently
                                    const eventData = parseEscrowCreatedEvent(message.body);
                                    if (eventData) {
                                        foundEvents++;
                                        console.log('\n    🎉 ESCROW CREATED EVENT FOUND! 🎉');
                                        // ... rest of event display code
                                    }
                                }
                            }
                        } catch (e) {
                            console.log('    Parse error:', e);
                        }
                    } else {
                        console.log('    No body or empty body');
                    }
                }
            }

            console.log(''); // Empty line between transactions
        }

        console.log(`\nSearch completed. Found ${foundEvents} EscrowCreated events.`);
    } catch (error) {
        console.error('Error searching for events:', error);
    }
}

// Function to search by specific transaction hash
async function findEventByTxHash(factoryAddress: Address, targetTxHash: string) {
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY,
    });

    console.log('Searching for specific transaction:', targetTxHash);

    try {
        const factoryTransactions = await client.getTransactions(factoryAddress, { limit: 50 });

        const targetTx = factoryTransactions.find((tx) => tx.hash().toString('hex') === targetTxHash);

        if (!targetTx) {
            console.log('Transaction not found in recent transactions');
            return;
        }

        console.log('Transaction found! Checking for events...');

        if (targetTx.outMessages.size > 0) {
            for (const [key, message] of targetTx.outMessages) {
                if (message.body && message.body.bits.length > 0) {
                    const eventData = parseEscrowCreatedEvent(message.body);

                    if (eventData) {
                        console.log('\n🎉 EscrowCreated Event Found!');
                        console.log('Order ID:', eventData.orderId.toString());
                        console.log('Hash Lock:', '0x' + eventData.hashLock.toString(16));
                        console.log('Escrow:', eventData.escrow.toString());
                        return eventData;
                    }
                }
            }
        }

        console.log('No EscrowCreated events found in this transaction');
    } catch (error) {
        console.error('Error searching for specific transaction:', error);
    }
}

async function main() {
    const FACTORY_ADDRESS = 'EQDRjTbGKtsUHQi40KnUxPzLjk0EKV544FFAA9nrE8zc_ySv';
    const factoryAddress = Address.parse(FACTORY_ADDRESS);

    // Search recent transactions for events
    await findEscrowEvents(factoryAddress, 2);

    // Uncomment to search for specific transaction
    // await findEventByTxHash(factoryAddress, 'YOUR_TX_HASH_HERE');
}

main().catch(console.error);
