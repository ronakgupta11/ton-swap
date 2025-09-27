import { Address, beginCell, toNano } from '@ton/core';
import { Escrow } from '../build/EscrowFactory/EscrowFactory_Escrow';
import { Factory } from '../build/EscrowFactory/EscrowFactory_Factory';
import { NetworkProvider } from '@ton/blueprint';
import { keccak256 } from 'js-sha3';

// Timelock stage constants
const STAGE_SRC_WITHDRAWAL = 0;
const STAGE_SRC_PUBLIC_WITHDRAWAL = 1;
const STAGE_SRC_CANCELLATION = 2;
const STAGE_SRC_PUBLIC_CANCELLATION = 3;
const STAGE_DST_WITHDRAWAL = 4;
const STAGE_DST_PUBLIC_WITHDRAWAL = 5;
const STAGE_DST_CANCELLATION = 6;

function getDeployedAtJS(state: bigint): bigint {
    return state >> BigInt(224); // deployedAtOffset = 224
}

function getTimeLockStateValueJS(state: bigint, stage: number): bigint {
    const bitShift = BigInt(stage * 32);
    const deployedAt = state >> BigInt(224);
    const stageValue = (state >> bitShift) & BigInt(0xffffffff);
    return deployedAt + stageValue;
}

export async function run(provider: NetworkProvider) {
    console.log('🔓 Withdrawing from  Escrow...\n');

    // Configuration - Replace these values
    const ESCROW_ADDRESS = 'EQC3-Rzjk37FmRgfjHyQOeFjzDJ4QwGsVlqzrJk6gA4DWVXB'; // Replace with your escrow address
    const SECRET = 'eth'; // Replace with your secret
    const FACTORY_ADDRESS = 'EQBNoJWwYCqo_TFE1UJDkeUOhEwU2DDhaTJyBSSF8ahXZ5fe'; // For timelock queries

    const escrowAddress = Address.parse(ESCROW_ADDRESS);
    const escrow = provider.open(Escrow.fromAddress(escrowAddress));
    const factoryAddress = Address.parse(FACTORY_ADDRESS);
    const factory = provider.open(Factory.fromAddress(factoryAddress));

    console.log('📋 Withdrawal Setup:');
    console.log(` 🏠 Escrow: ${escrowAddress}`);
    console.log(` 🔑 Secret: "${SECRET}"`);
    console.log(` 🔒 Hash Lock: 0x${BigInt('0x' + keccak256(SECRET)).toString(16)}`);
    console.log(` 👤 Sender: ${provider.sender().address}\n`);

    // Check escrow state before withdrawal
    console.log('📊 Checking complete escrow state...');
    try {
        const isInitialized = await escrow.getIsInitialized();
        const data = await escrow.getGetData();

        console.log('\n📋 Escrow Data:');
        console.log(`   ✅ Initialized: ${isInitialized}`);
        console.log(`   📦 Order ID: ${data.orderId}`);
        console.log(`   🔒 Hash Lock: 0x${data.hashLock.toString(16)}`);
        console.log(`   🔗 DST Chain: ${data.dstChain}`);
        console.log(`   ⏰ Finality Seconds: ${data.finalitySeconds}`);
        console.log(`   💰 Amount: ${data.amount}`);
        console.log(`   💰 Safety Deposit: ${data.safetyDeposit}`);
        console.log(`   👤 Taker: ${data.taker}`);
        console.log(`   👤 Maker: ${data.maker}`);
        console.log(`   🔐 TimeLock State: 0x${data.timeLockState.toString(16)}`);

        if (!isInitialized) {
            console.log('\n❌ Escrow not initialized yet');
            return;
        }

        // Analyze timelock state
        console.log('\n⏰ Timelock Analysis:');
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const deployedAt = getDeployedAtJS(data.timeLockState);

        console.log(`   📅 Current Time: ${currentTime} (${new Date(Number(currentTime) * 1000).toLocaleString()})`);
        console.log(`   📅 Deployed At: ${deployedAt} (${new Date(Number(deployedAt) * 1000).toLocaleString()})`);

        // Calculate timelock periods using factory getters
        try {
            const stages = [
                { name: 'SRC_WITHDRAWAL', id: STAGE_SRC_WITHDRAWAL },
                { name: 'SRC_PUBLIC_WITHDRAWAL', id: STAGE_SRC_PUBLIC_WITHDRAWAL },
                { name: 'SRC_CANCELLATION', id: STAGE_SRC_CANCELLATION },
                { name: 'SRC_PUBLIC_CANCELLATION', id: STAGE_SRC_PUBLIC_CANCELLATION },
                { name: 'DST_WITHDRAWAL', id: STAGE_DST_WITHDRAWAL },
                { name: 'DST_PUBLIC_WITHDRAWAL', id: STAGE_DST_PUBLIC_WITHDRAWAL },
                { name: 'DST_CANCELLATION', id: STAGE_DST_CANCELLATION },
            ];

            console.log('\n🕐 Timelock Periods:');
            for (const stage of stages) {
                try {
                    const stageTime = await factory.getGetTimeLockStageValue(data.timeLockState, BigInt(stage.id));
                    const timeFromNow = Number(stageTime - currentTime);
                    const isPast = timeFromNow <= 0;
                    const statusEmoji = isPast ? '✅' : '⏳';

                    console.log(
                        `   ${statusEmoji} ${stage.name.padEnd(25)}: ${isPast ? 'ACTIVE' : `+${timeFromNow}s`} (${new Date(Number(stageTime) * 1000).toLocaleTimeString()})`,
                    );
                } catch (e) {
                    console.log(`   ❓ ${stage.name.padEnd(25)}: Could not calculate`);
                }
            }
        } catch (timelockError) {
            console.log('   ⚠️  Could not analyze timelock periods');
        }

        // Determine withdrawal eligibility
        console.log('\n🔍 Withdrawal Eligibility Check:');

        // For destination chain (dstChain = 0), check DST withdrawal periods
        if (data.dstChain === BigInt(0)) {
            try {
                const dstWithdrawPeriod = await factory.getGetTimeLockStageValue(
                    data.timeLockState,
                    BigInt(STAGE_DST_PUBLIC_WITHDRAWAL),
                );
                const dstCancellationPeriod = await factory.getGetTimeLockStageValue(
                    data.timeLockState,
                    BigInt(STAGE_DST_CANCELLATION),
                );

                const canWithdraw = currentTime >= dstWithdrawPeriod && currentTime < dstCancellationPeriod;
                const timeToWithdraw = Number(dstWithdrawPeriod - currentTime);
                const timeToCancellation = Number(dstCancellationPeriod - currentTime);

                console.log(
                    `   🔓 DST Withdrawal Period: ${currentTime >= dstWithdrawPeriod ? '✅ ACTIVE' : `⏳ ${timeToWithdraw}s remaining`}`,
                );
                console.log(
                    `   ❌ DST Cancellation Period: ${currentTime >= dstCancellationPeriod ? '🚨 ACTIVE' : `⏳ ${timeToCancellation}s remaining`}`,
                );
                console.log(`   🎯 Can Withdraw: ${canWithdraw ? '✅ YES' : '❌ NO'}`);

                if (!canWithdraw) {
                    if (currentTime < dstWithdrawPeriod) {
                        console.log(`   ⏰ Wait ${timeToWithdraw} seconds for withdrawal period`);
                    } else if (currentTime >= dstCancellationPeriod) {
                        console.log(`   🚨 Cancellation period is active - withdrawal no longer possible`);
                        return;
                    }
                }
            } catch (eligibilityError) {
                console.log('   ⚠️  Could not determine withdrawal eligibility');
            }
        } else {
            // For source chain, check SRC withdrawal periods
            try {
                const srcWithdrawPeriod = await factory.getGetTimeLockStageValue(
                    data.timeLockState,
                    BigInt(STAGE_SRC_PUBLIC_WITHDRAWAL),
                );
                const srcCancellationPeriod = await factory.getGetTimeLockStageValue(
                    data.timeLockState,
                    BigInt(STAGE_SRC_PUBLIC_CANCELLATION),
                );

                const canWithdraw = currentTime >= srcWithdrawPeriod && currentTime < srcCancellationPeriod;
                console.log(`   🔓 SRC Withdrawal: ${canWithdraw ? '✅ ACTIVE' : '❌ NOT ACTIVE'}`);
                console.log(`   🎯 Can Withdraw: ${canWithdraw ? '✅ YES' : '❌ NO'}`);
            } catch (eligibilityError) {
                console.log('   ⚠️  Could not determine withdrawal eligibility');
            }
        }

        // Verify secret hash
        const providedHashLock = BigInt('0x' + keccak256(SECRET));
        const hashMatch = providedHashLock === data.hashLock;
        console.log(`   🔐 Secret Hash Match: ${hashMatch ? '✅ YES' : '❌ NO'}`);

        if (!hashMatch) {
            console.log('   ❌ Secret does not match hash lock!');
            return;
        }
    } catch (error) {
        console.log('⚠️ Could not fetch escrow state:', error);
        console.log('Proceeding anyway...\n');
    }

    // Send withdrawal message
    console.log('\n💸 Sending withdraw transaction...');
    const withdrawMessage = beginCell()
        .storeUint(0x2365d020, 32) // op code for Withdraw
        .storeUint(0, 64) // query_id
        .storeRef(beginCell().storeStringTail(SECRET).endCell())
        .endCell();

    try {
        const result = await provider.sender().send({
            to: escrowAddress,
            value: toNano('0.1'), // Gas for withdrawal + jetton transfer
            body: withdrawMessage,
        });

        console.log('✅ Withdrawal transaction sent!');

        console.log('⏳ Check tonscan for confirmation...');
        console.log(`📤 Transaction should transfer tokens to: ${provider.sender().address}`);
        console.log('\n🎯 Expected outcome:');
        console.log('   1. Tokens transferred to taker (you)');
        console.log('   2. Remaining TON sent to maker');
        console.log('   3. Escrow contract completes withdrawal');
    } catch (error) {
        console.error('❌ Failed to send withdrawal:', error);
    }
}
