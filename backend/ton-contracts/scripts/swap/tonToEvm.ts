import { Address, beginCell, toNano, SendMode } from '@ton/core';
import { TonClient, WalletContractV5R1, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { EscrowFactory } from '../../build/EscrowFactory/EscrowFactory_EscrowFactory';
import { Escrow } from '../../build/EscrowFactory/EscrowFactory_Escrow';
import { JettonMaster } from '@ton/ton';
import { keccak256 } from 'js-sha3';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import { Cell } from '@ton/core';

dotenv.config();

interface SwapConfig {
    // TON side
    factoryAddress: string;
    jettonMaster?: string; // Optional for native TON swaps
    amount: number; // Amount to swap
    
    // EVM side
    evmChainId: number; // Target EVM chain ID
    evmTokenAddress?: string; // Target EVM token address (0x0 for ETH)
    evmRecipientAddress: string; // Where to send tokens on EVM
    
    // Swap parameters
    orderId: bigint;
    timelockSeconds: number; // How long before public withdrawal
}

function createTimeLockState(data: {
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

function createExtraData(evmRecipient: string, evmTokenAddress?: string): Cell {
    const recipientBigInt = BigInt(evmRecipient);
    const tokenBigInt = evmTokenAddress ? BigInt(evmTokenAddress) : BigInt(0);
    const randomData = BigInt('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    
    return beginCell()
        .storeUint(recipientBigInt, 160)
        .storeUint(tokenBigInt, 160)
        .storeUint(randomData, 256)
        .endCell();
}

async function performTonToEvmSwap(config: SwapConfig) {
    console.log('🔄 Starting TON to EVM Swap\n');
    console.log('Configuration:', {
        amount: config.amount,
        evmChainId: config.evmChainId,
        evmRecipient: config.evmRecipientAddress,
        orderId: config.orderId.toString(),
        timelockSeconds: config.timelockSeconds
    });

    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) {
        console.error('❌ MNEMONIC environment variable is required');
        process.exit(1);
    }

    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY,
    });

    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
    const wallet = WalletContractV5R1.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });
    const walletContract = client.open(wallet);
    const walletAddress = wallet.address;

    console.log('👛 Wallet Address:', walletAddress.toString());

    const balance = await walletContract.getBalance();
    console.log('💰 Wallet Balance:', (balance / 1000000000n).toString(), 'TON');

    if (balance < toNano('0.5')) {
        console.warn('⚠️  Low wallet balance. Make sure you have enough TON for fees.');
    }

    // Generate secret and hash lock
    const secretBytes = randomBytes(32);
    const secretHex = '0x' + secretBytes.toString('hex');
    const hashLock = BigInt('0x' + keccak256(secretBytes));
    
    console.log('🔐 Secret (hex):', secretHex);
    console.log('🔒 Hash Lock:', '0x' + hashLock.toString(16));

    const factoryAddress = Address.parse(config.factoryAddress);
    const factory = client.open(EscrowFactory.fromAddress(factoryAddress));

    // Create timelock state
    const timeLockData = {
        srcWithdrawal: BigInt(0),
        srcPublicWithdrawal: BigInt(0),
        srcCancellation: BigInt(0),
        srcPublicCancellation: BigInt(0),
        dstWithdrawal: BigInt(0),
        dstPublicWithdrawal: BigInt(config.timelockSeconds),
        dstCancellation: BigInt(config.timelockSeconds + 400),
    };

    const timeLockState = createTimeLockState(timeLockData);
    console.log('⏰ TimeLock State:', '0x' + timeLockState.toString(16));

    // Get escrow address
    const escrowAddress = await factory.getGetEscrowAddress(
        config.orderId, 
        hashLock, 
        BigInt(config.evmChainId), 
        walletAddress
    );
    console.log('🏦 Escrow Address:', escrowAddress.toString());

    // Create extra data for EVM
    const extraData = createExtraData(config.evmRecipientAddress, config.evmTokenAddress);
    console.log('📦 Extra Data created for EVM recipient:', config.evmRecipientAddress);

    if (config.jettonMaster) {
        // Jetton swap
        console.log('🪙 Performing Jetton swap...');
        const jettonMaster = Address.parse(config.jettonMaster);
        const jettonContract = client.open(JettonMaster.create(jettonMaster));
        const escrowJettonWallet = await jettonContract.getWalletAddress(escrowAddress);
        const yourJettonWallet = await jettonContract.getWalletAddress(walletAddress);

        const addressesCell = beginCell()
            .storeUint(timeLockState, 256)
            .storeAddress(walletAddress)
            .storeAddress(escrowJettonWallet)
            .storeRef(extraData)
            .endCell();

        const mainCell = beginCell()
            .storeUint(0, 32) // finalitySeconds
            .storeUint(config.evmChainId, 16) // dstChain
            .storeUint(config.orderId, 256) // orderId
            .storeUint(hashLock, 256) // hashLock
            .storeRef(addressesCell)
            .endCell();

        const jettonTransferBody = beginCell()
            .storeUint(0xf8a7ea5, 32) // JettonTransfer op
            .storeUint(0, 64) // queryId
            .storeCoins(config.amount) // amount
            .storeAddress(factoryAddress) // destination
            .storeAddress(walletAddress) // responseDestination
            .storeBit(0) // customPayload null
            .storeCoins(toNano('0.4')) // forwardTonAmount
            .storeBit(1) // forwardPayload present
            .storeRef(mainCell)
            .endCell();

    console.log('\n📤 Sending jetton transfer transaction...');

    const seqno = await walletContract.getSeqno();
    const transfer = walletContract.createTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: yourJettonWallet,
                value: toNano('0.51'),
                body: jettonTransferBody,
            }),
        ],
        sendMode: SendMode.PAY_GAS_SEPARATELY,
    });

    await walletContract.send(transfer);
    console.log('✅ Jetton transfer sent!');

    // Wait for confirmation
    let currentSeqno = seqno;
    let attempts = 0;
    const maxAttempts = 60;

    while (currentSeqno === seqno && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        currentSeqno = await walletContract.getSeqno();
        attempts++;

        if (attempts % 10 === 0) {
            console.log(`⏳ Waiting... ${attempts * 1.5}s elapsed`);
        }
    }

    if (currentSeqno === seqno) {
        console.log('⏰ Transaction timeout. Check testnet.tonscan.org manually.');
        return;
    }

} else {
    // Native TON swap
    console.log('💎 Performing native TON swap...');
    
    const addressesCell = beginCell()
        .storeUint(timeLockState, 256)
        .storeAddress(walletAddress)
        .storeAddress(null) // No jetton wallet for native TON
        .storeRef(extraData)
        .endCell();

    const mainCell = beginCell()
        .storeUint(0, 32) // finalitySeconds
        .storeUint(config.evmChainId, 16) // dstChain
        .storeUint(config.orderId, 256) // orderId
        .storeUint(hashLock, 256) // hashLock
        .storeRef(addressesCell)
        .endCell();

    console.log('\n📤 Sending TON transfer transaction...');

    const seqno = await walletContract.getSeqno();
    const transfer = walletContract.createTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: factoryAddress,
                value: toNano(config.amount.toString()) + toNano('0.1'), // amount + gas
                body: mainCell,
            }),
        ],
        sendMode: SendMode.PAY_GAS_SEPARATELY,
    });

    await walletContract.send(transfer);
    console.log('✅ TON transfer sent!');

    // Wait for confirmation
    let currentSeqno = seqno;
    let attempts = 0;
    const maxAttempts = 60;

    while (currentSeqno === seqno && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        currentSeqno = await walletContract.getSeqno();
        attempts++;

        if (attempts % 10 === 0) {
            console.log(`⏳ Waiting... ${attempts * 1.5}s elapsed`);
        }
    }

    if (currentSeqno === seqno) {
        console.log('⏰ Transaction timeout. Check testnet.tonscan.org manually.');
        return;
    }
}

    console.log('✅ Transaction confirmed!\n');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check escrow state
    console.log('🔍 Checking escrow state...');
    try {
        const escrow = client.open(Escrow.fromAddress(escrowAddress));
        const isInitialized = await escrow.getIsInitialized();
        console.log('🏦 Escrow Initialized:', isInitialized);

        if (isInitialized) {
            const escrowData = await escrow.getGetData();
            console.log('\n📊 Escrow Data:');
            console.log('  Order ID:', escrowData.orderId.toString());
            console.log('  Hash Lock:', '0x' + escrowData.hashLock.toString(16));
            console.log('  DST Chain:', escrowData.dstChain.toString());
            console.log('  Amount:', escrowData.amount.toString());
            console.log('  Taker:', escrowData.taker?.toString() || 'null');
            console.log('  Maker:', escrowData.maker?.toString() || 'null');
        }
    } catch (error) {
        console.log('❌ Could not read escrow state:', error);
    }

    console.log('\n🎉 TON to EVM swap initiated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Wait for the EVM side to complete the swap');
    console.log('2. Use the secret to withdraw on EVM side:', secretHex);
    console.log('3. Or wait for timelock expiration for public withdrawal');
    console.log('\n🔗 Escrow Address:', escrowAddress.toString());
    console.log('🔐 Secret (hex):', secretHex);
    console.log('🔒 Hash Lock:', '0x' + hashLock.toString(16));
}

// Example usage
async function main() {
    // Import testnet configuration
    const { testnetConfig } = await import('./testnet-config');
    
    console.log('🧪 Running on TON Testnet');
    console.log('📋 Configuration:', {
        amount: testnetConfig.amount,
        evmChainId: testnetConfig.evmChainId,
        evmRecipient: testnetConfig.evmRecipientAddress,
        orderId: testnetConfig.orderId.toString(),
        timelockSeconds: testnetConfig.timelockSeconds
    });

    await performTonToEvmSwap(testnetConfig);
}

if (require.main === module) {
    main().catch(console.error);
}

export { performTonToEvmSwap, SwapConfig };
