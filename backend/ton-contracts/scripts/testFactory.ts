import { Address, beginCell, toNano, Cell } from '@ton/core';
import { Factory } from '../build/EscrowFactory/EscrowFactory_Factory';
import { Escrow } from '../build/EscrowFactory/EscrowFactory_Escrow';
import { NetworkProvider } from '@ton/blueprint';
import { JettonMaster } from '@ton/ton';
import { keccak256 } from 'js-sha3';

// For real event monitoring, you would use:
// import { TonApiClient } from "@ton-api/client";
// import { HttpApi } from 'tonapi-sdk-js';

// Timelock creation helper
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
    init |= data.srcWithdrawal << BigInt(0 * 32); // stage 0
    init |= data.srcPublicWithdrawal << BigInt(1 * 32); // stage 1
    init |= data.srcCancellation << BigInt(2 * 32); // stage 2
    init |= data.srcPublicCancellation << BigInt(3 * 32); // stage 3
    init |= data.dstWithdrawal << BigInt(4 * 32); // stage 4
    init |= data.dstPublicWithdrawal << BigInt(5 * 32); // stage 5
    init |= data.dstCancellation << BigInt(6 * 32); // stage 6
    return init;
}

export async function run(provider: NetworkProvider) {
    console.log('🏭 Configuring and testing CellJMPI Factory with Split Cells...\n');

    const FACTORY_ADDRESS = 'EQDRjTbGKtsUHQi40KnUxPzLjk0EKV544FFAA9nrE8zc_ySv';
    const USDT_MASTER = Address.parse('EQBX6K9aXVl3nXINCyPPL86C4ONVmQ8vK360u6dykFKXpHCa');
    const USDT_AMOUNT = 1;

    const factoryAddress = Address.parse(FACTORY_ADDRESS);
    const factory = provider.open(Factory.fromAddress(factoryAddress));

    console.log('📋 Factory Setup:');
    console.log(` 🏭 Factory: ${factoryAddress}`);
    console.log(` 👤 Owner: ${provider.sender().address}\n`);

    // Step 1: Calculate escrow parameters
    console.log('🧮 Step 1: Calculating escrow parameters...');
    const takerAddress = provider.sender().address!;
    const makerAddress = provider.sender().address!;
    const orderId = BigInt(1);
    const secret = 's';
    const hashLock = BigInt('0x' + keccak256(secret));
    const dstChain = 0; // Destination chain (TON side)

    console.log(` Hash Lock: ${hashLock.toString(16)}`);
    console.log(` Chain: ${dstChain} (destination/TON side)`);

    // Step 2: Create timelock state for destination flow
    console.log('\n⏰ Step 2: Creating timelock state for destination flow...');
    const timeLockData = {
        srcWithdrawal: BigInt(0), // Source side: 0 (not used)
        srcPublicWithdrawal: BigInt(0), // Source side: 0 (not used)
        srcCancellation: BigInt(0), // Source side: 0 (not used)
        srcPublicCancellation: BigInt(0), // Source side: 0 (not used)
        dstWithdrawal: BigInt(0), // Immediate withdrawal (0 seconds)
        dstPublicWithdrawal: BigInt(100), // Public withdrawal after 100 seconds
        dstCancellation: BigInt(600), // Cancellation after 600 seconds (10 minutes)
    };

    const timeLockState = createTimeLockStateJS(timeLockData);
    console.log(` ⏰ TimeLock State: 0x${timeLockState.toString(16)}`);
    console.log(` 🔓 DST Withdrawal: ${timeLockData.dstWithdrawal}s (immediate)`);
    console.log(` 🔓 DST Public Withdrawal: ${timeLockData.dstPublicWithdrawal}s`);
    console.log(` ❌ DST Cancellation: ${timeLockData.dstCancellation}s`);

    // Step 3: Get escrow address from factory contract
    console.log('\n🏠 Step 3: Getting escrow address from factory...');
    const escrowAddress = await factory.getGetEscrowAddress(orderId, hashLock, BigInt(dstChain), makerAddress);
    console.log(` 🏠 Escrow Address: ${escrowAddress}`);

    // Step 4: Get jetton wallet for escrow address
    console.log('\n🪙 Step 4: Getting escrow jetton wallet...');
    const usdtContract = provider.open(JettonMaster.create(USDT_MASTER));
    const escrowJettonWallet = await usdtContract.getWalletAddress(escrowAddress);
    const yourUsdtWallet = await usdtContract.getWalletAddress(provider.sender().address!);
    console.log(` 💳 Escrow USDT Wallet: ${escrowJettonWallet}`);

    // Step 5: Create extraData with Ethereum addresses and random data
    console.log('\n📦 Step 5: Creating extraData with Ethereum addresses...');
    const ethAddress1 = BigInt('0x51aa94BC132221A1924977499ceb50A8FE0CfAfe'); // 160 bits
    const ethAddress2 = BigInt('0x51aa94BC132221A1924977499ceb50A8FE0CfAfe'); // 160 bits (fixed invalid hex)
    const randomData = BigInt(
        '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    ); // 256 bits

    const extraData = beginCell()
        .storeUint(ethAddress1, 160)
        .storeUint(ethAddress2, 160)
        .storeUint(randomData, 256)
        .endCell();

    console.log(` 🔗 ETH Address 1: 0x${ethAddress1.toString(16).padStart(40, '0')}`);
    console.log(` 🔗 ETH Address 2: 0x${ethAddress2.toString(16).padStart(40, '0')}`);
    console.log(` 🎲 Random Data: 0x${randomData.toString(16).padStart(64, '0')}`);

    // Step 6: Create split cell structure for escrow
    console.log('\n💸 Step 6: Creating escrow with split cell structure...');

    // Create addresses cell with timeLockState, addresses, and extraData
    const addressesCell = beginCell()
        .storeUint(timeLockState, 256)
        .storeAddress(takerAddress)
        .storeAddress(escrowJettonWallet)
        .storeRef(extraData) // Store extraData as reference
        .endCell();

    // Create main cell with basic parameters and reference to addresses
    const mainCell = beginCell()
        .storeUint(0, 32) // finalitySeconds = 0
        .storeUint(dstChain, 16) // dstChain = 0
        .storeUint(orderId, 256) // orderId
        .storeUint(hashLock, 256) // hashLock
        .storeRef(addressesCell) // Reference to addresses cell
        .endCell();

    // Create jetton transfer with split payload
    const jettonTransferBody = beginCell()
        .storeUint(0xf8a7ea5, 32) // JettonTransfer op
        .storeUint(0, 64) // queryId
        .storeCoins(USDT_AMOUNT) // amount
        .storeAddress(factoryAddress) // destination
        .storeAddress(provider.sender().address) // responseDestination
        .storeBit(0) // customPayload null
        .storeCoins(toNano('0.4')) // forwardTonAmount
        .storeBit(1) // forwardPayload present
        .storeRef(mainCell) // Reference to our split payload
        .endCell();

    console.log(` 📤 Sending ${USDT_AMOUNT} USDT units...`);
    console.log(` 📦 Order ID: ${orderId}`);
    console.log(` 🔐 Secret: "${secret}"`);
    console.log(` 🔒 Hash Lock: 0x${hashLock.toString(16)}`);

    try {
        const result = await provider.sender().send({
            to: yourUsdtWallet,
            value: toNano('0.51'),
            body: jettonTransferBody,
        });

        console.log('✅ Escrow creation sent!');
        console.log(` 🏠 Escrow will be deployed at: ${escrowAddress}`);
        console.log(` 💳 Escrow jetton wallet: ${escrowJettonWallet}`);

        // Step 8: Also check escrow state
        console.log('\n📊 Step 8: Reading escrow state...');
        try {
            const escrow = provider.open(Escrow.fromAddress(escrowAddress));

            // Get escrow data
            const escrowData = await escrow.getGetData();
            console.log('\n📋 Escrow Data:');
            console.log(`   📦 Order ID: ${escrowData.orderId}`);
            console.log(`   🔒 Hash Lock: 0x${escrowData.hashLock.toString(16)}`);
            console.log(`   🔗 DST Chain: ${escrowData.dstChain}`);
            console.log(`   ⏰ Finality Seconds: ${escrowData.finalitySeconds}`);
            console.log(`   💰 Amount: ${escrowData.amount}`);
            console.log(`   👤 Taker: ${escrowData.taker}`);
            console.log(`   👤 Maker: ${escrowData.maker}`);
            console.log(`   🔐 TimeLock State: 0x${escrowData.timeLockState.toString(16)}`);

            // Check if initialized
            const isInitialized = await escrow.getIsInitialized();
            console.log(`   ✅ Initialized: ${isInitialized}`);
        } catch (stateError) {
            console.log('⚠️  Could not read escrow state (might still be deploying)');
        }

        console.log('\n🎯 Testing Summary:');
        console.log('   ✅ Split cell structure implemented');
        console.log('   ✅ ExtraData with ETH addresses created');
        console.log('   ✅ Destination chain flow configured');
        console.log('   ✅ TimeLight state set for DST flow');
        console.log('   ✅ Escrow deployment initiated');
    } catch (error) {
        console.error('❌ Failed to create escrow:', error);
        return;
    }
}
