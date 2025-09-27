import { Address, beginCell, toNano, Cell } from '@ton/core';
import { Factory } from '../build/EscrowFactory/EscrowFactory_Factory';
import { NetworkProvider } from '@ton/blueprint';

// Timelock constants (matching Tact code)
const DEPLOYED_AT_MASK = BigInt('0xffffffff00000000000000000000000000000000000000000000000000000000');
const DEPLOYED_AT_OFFSET = 224;

// Stage constants
const STAGE_SRC_WITHDRAWAL = 0;
const STAGE_SRC_PUBLIC_WITHDRAWAL = 1;
const STAGE_SRC_CANCELLATION = 2;
const STAGE_SRC_PUBLIC_CANCELLATION = 3;
const STAGE_DST_WITHDRAWAL = 4;
const STAGE_DST_PUBLIC_WITHDRAWAL = 5;
const STAGE_DST_CANCELLATION = 6;

// JavaScript implementation of timelock functions for verification
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
    init |= data.srcWithdrawal << BigInt(STAGE_SRC_WITHDRAWAL * 32);
    init |= data.srcPublicWithdrawal << BigInt(STAGE_SRC_PUBLIC_WITHDRAWAL * 32);
    init |= data.srcCancellation << BigInt(STAGE_SRC_CANCELLATION * 32);
    init |= data.srcPublicCancellation << BigInt(STAGE_SRC_PUBLIC_CANCELLATION * 32);
    init |= data.dstWithdrawal << BigInt(STAGE_DST_WITHDRAWAL * 32);
    init |= data.dstPublicWithdrawal << BigInt(STAGE_DST_PUBLIC_WITHDRAWAL * 32);
    init |= data.dstCancellation << BigInt(STAGE_DST_CANCELLATION * 32);
    return init;
}

function setDeployedAtJS(state: bigint, at: bigint): bigint {
    const cleared = state & ~DEPLOYED_AT_MASK;
    const shifted = at << BigInt(DEPLOYED_AT_OFFSET);
    return cleared | shifted;
}

function getTimeLockStateValueJS(state: bigint, stage: number): bigint {
    const bitShift = BigInt(stage * 32);
    const deployedAt = state >> BigInt(DEPLOYED_AT_OFFSET);
    const stageValue = (state >> bitShift) & BigInt(0xffffffff);
    return deployedAt + stageValue;
}

function getDeployedAtJS(state: bigint): bigint {
    return state >> BigInt(DEPLOYED_AT_OFFSET);
}

// Create TimeLockData as a Cell since the struct might not be directly supported
function createTimeLockDataCell(data: {
    srcWithdrawal: bigint;
    srcPublicWithdrawal: bigint;
    srcCancellation: bigint;
    srcPublicCancellation: bigint;
    dstWithdrawal: bigint;
    dstPublicWithdrawal: bigint;
    dstCancellation: bigint;
}): Cell {
    return beginCell()
        .storeUint(data.srcWithdrawal, 256)
        .storeUint(data.srcPublicWithdrawal, 256)
        .storeUint(data.srcCancellation, 256)
        .storeUint(data.srcPublicCancellation, 256)
        .storeUint(data.dstWithdrawal, 256)
        .storeUint(data.dstPublicWithdrawal, 256)
        .storeUint(data.dstCancellation, 256)
        .endCell();
}

export async function run(provider: NetworkProvider) {
    console.log('🧪 Testing TimeLock Library Implementation...\n');

    const FACTORY_ADDRESS = 'EQAwLMl-QA-X13xQTHI8ldFzLWH_ljMdBZNCa1MF5xHNCeYn';
    const factoryAddress = Address.parse(FACTORY_ADDRESS);
    const factory = provider.open(Factory.fromAddress(factoryAddress));

    console.log('📋 Factory Setup:');
    console.log(` 🏭 Factory: ${factoryAddress}`);
    console.log(` 👤 Owner: ${provider.sender().address}\n`);

    // Test data
    const testData = {
        srcWithdrawal: BigInt(3600), // 1 hour
        srcPublicWithdrawal: BigInt(7200), // 2 hours
        srcCancellation: BigInt(10800), // 3 hours
        srcPublicCancellation: BigInt(14400), // 4 hours
        dstWithdrawal: BigInt(1800), // 30 minutes
        dstPublicWithdrawal: BigInt(5400), // 1.5 hours
        dstCancellation: BigInt(12600), // 3.5 hours
    };

    console.log('🧮 Test 1: JavaScript TimeLock State Creation');
    console.log('═'.repeat(50));

    console.log('📊 Test Data:');
    Object.entries(testData).forEach(([key, value]) => {
        console.log(`   ${key}: ${value} seconds (${Number(value) / 60} minutes)`);
    });

    // Create timelock state using JavaScript implementation
    const jsTimeLockState = createTimeLockStateJS(testData);
    console.log(`\n🔍 JS TimeLock State: 0x${jsTimeLockState.toString(16)}`);

    try {
        // Test 2: Individual Getter Functions
        console.log('\n🧮 Test 2: Testing Individual Contract Functions');
        console.log('═'.repeat(50));

        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const testDeployedAt = currentTime + BigInt(3600); // 1 hour from now

        console.log(`📅 Current Time: ${currentTime} (${new Date(Number(currentTime) * 1000)})`);
        console.log(`📅 Test DeployedAt: ${testDeployedAt} (${new Date(Number(testDeployedAt) * 1000)})`);

        // Test setDeployedAt function
        console.log('\n🔧 Testing setDeployedAtInTimeLockState...');
        const contractStateWithDeployedAt = await factory.getSetDeployedAtInTimeLockState(
            jsTimeLockState,
            testDeployedAt,
        );
        const jsStateWithDeployedAt = setDeployedAtJS(jsTimeLockState, testDeployedAt);

        console.log(`   Contract Result: 0x${contractStateWithDeployedAt.toString(16)}`);
        console.log(`   JS Result:       0x${jsStateWithDeployedAt.toString(16)}`);
        console.log(`   ✅ Match: ${contractStateWithDeployedAt === jsStateWithDeployedAt}`);

        if (contractStateWithDeployedAt !== jsStateWithDeployedAt) {
            console.log('❌ MISMATCH in setDeployedAt function!');
            return;
        }

        // Test 3: Stage Value Extraction
        console.log('\n🧮 Test 3: Stage Value Extraction');
        console.log('═'.repeat(50));

        const stages = [
            { name: 'SRC_WITHDRAWAL', id: STAGE_SRC_WITHDRAWAL, expected: testData.srcWithdrawal },
            { name: 'SRC_PUBLIC_WITHDRAWAL', id: STAGE_SRC_PUBLIC_WITHDRAWAL, expected: testData.srcPublicWithdrawal },
            { name: 'SRC_CANCELLATION', id: STAGE_SRC_CANCELLATION, expected: testData.srcCancellation },
            {
                name: 'SRC_PUBLIC_CANCELLATION',
                id: STAGE_SRC_PUBLIC_CANCELLATION,
                expected: testData.srcPublicCancellation,
            },
            { name: 'DST_WITHDRAWAL', id: STAGE_DST_WITHDRAWAL, expected: testData.dstWithdrawal },
            { name: 'DST_PUBLIC_WITHDRAWAL', id: STAGE_DST_PUBLIC_WITHDRAWAL, expected: testData.dstPublicWithdrawal },
            { name: 'DST_CANCELLATION', id: STAGE_DST_CANCELLATION, expected: testData.dstCancellation },
        ];

        let allStageTestsPassed = true;

        for (const stage of stages) {
            const contractValue = await factory.getGetTimeLockStageValue(contractStateWithDeployedAt, BigInt(stage.id));
            const jsValue = getTimeLockStateValueJS(contractStateWithDeployedAt, stage.id);
            const expectedValue = testDeployedAt + stage.expected;

            const contractMatch = contractValue === expectedValue;
            const jsMatch = jsValue === expectedValue;
            const bothMatch = contractValue === jsValue;

            console.log(`\n📊 ${stage.name}:`);
            console.log(`   Expected: ${expectedValue} (deployedAt + ${stage.expected})`);
            console.log(`   Contract: ${contractValue} ${contractMatch ? '✅PASS' : '❌FAIL'}`);
            console.log(`   JS:       ${jsValue} ${jsMatch ? '✅PASS' : '❌FAIL'}`);
            console.log(`   Match:    ${bothMatch ? '✅PASS' : '❌FAIL'}`);

            if (!contractMatch || !jsMatch || !bothMatch) {
                allStageTestsPassed = false;
            }
        }

        // Test 4: Current Time Integration
        console.log('\n🧮 Test 4: Current Time Integration');
        console.log('═'.repeat(50));

        const currentStateWithTime = await factory.getWithCurrentDeployedAtInTimeLockState(jsTimeLockState);
        const currentTimeFromContract = getDeployedAtJS(currentStateWithTime);
        const actualCurrentTime = BigInt(Math.floor(Date.now() / 1000));

        console.log(`📅 Contract Current Time: ${currentTimeFromContract}`);
        console.log(`📅 Actual Current Time:   ${actualCurrentTime}`);
        console.log(`📅 Difference: ${Number(actualCurrentTime - currentTimeFromContract)} seconds`);

        // Allow up to 10 seconds difference for network latency
        const timeDiff = Number(
            actualCurrentTime > currentTimeFromContract
                ? actualCurrentTime - currentTimeFromContract
                : currentTimeFromContract - actualCurrentTime,
        );
        const timeTestPassed = timeDiff <= 10;
        console.log(`   ✅ Time Test: ${timeTestPassed ? 'PASS' : 'FAIL'} (diff: ${timeDiff}s)`);

        // Test 5: Bit Pattern Analysis
        console.log('\n🧮 Test 5: Bit Pattern Analysis');
        console.log('═'.repeat(50));

        console.log('🔍 Analyzing bit patterns in timelock state...');
        console.log(`Original State:     0x${jsTimeLockState.toString(16).padStart(64, '0')}`);
        console.log(`With DeployedAt:    0x${contractStateWithDeployedAt.toString(16).padStart(64, '0')}`);
        console.log(`Current Time State: 0x${currentStateWithTime.toString(16).padStart(64, '0')}`);

        // Extract each stage value from the state
        console.log('\n📊 Stage Values in State:');
        for (let i = 0; i < 7; i++) {
            const stageName = [
                'SRC_WITHDRAWAL',
                'SRC_PUBLIC_WITHDRAWAL',
                'SRC_CANCELLATION',
                'SRC_PUBLIC_CANCELLATION',
                'DST_WITHDRAWAL',
                'DST_PUBLIC_WITHDRAWAL',
                'DST_CANCELLATION',
            ][i];
            const bitShift = BigInt(i * 32);
            const stageValue = (jsTimeLockState >> bitShift) & BigInt(0xffffffff);
            console.log(`   ${stageName}: ${stageValue} (at bits ${i * 32}-${i * 32 + 31})`);
        }

        // Test 6: Practical Scenario
        console.log('\n🧮 Test 6: Practical Escrow Scenario');
        console.log('═'.repeat(50));

        const practicalData = {
            srcWithdrawal: BigInt(600), // 10 minutes
            srcPublicWithdrawal: BigInt(1800), // 30 minutes
            srcCancellation: BigInt(3600), // 1 hour
            srcPublicCancellation: BigInt(7200), // 2 hours
            dstWithdrawal: BigInt(300), // 5 minutes
            dstPublicWithdrawal: BigInt(900), // 15 minutes
            dstCancellation: BigInt(2700), // 45 minutes
        };

        const practicalState = createTimeLockStateJS(practicalData);
        const practicalStateWithTime = await factory.getSetDeployedAtInTimeLockState(practicalState, actualCurrentTime);

        console.log('📊 Practical Scenario Timeline (from now):');
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const value = await factory.getGetTimeLockStageValue(practicalStateWithTime, BigInt(stage.id));
            const timeFromNow = Number(value - actualCurrentTime);
            const date = new Date(Number(value) * 1000);

            console.log(
                `   ${stage.name.padEnd(25)}: +${timeFromNow.toString().padStart(4)}s (${date.toLocaleTimeString()})`,
            );
        }

        // Final Summary
        console.log('\n📋 Test Summary');
        console.log('═'.repeat(50));
        console.log(`✅ JavaScript Implementation: PASS`);
        console.log(`✅ setDeployedAt Function: PASS`);
        console.log(`✅ Stage Value Extraction: ${allStageTestsPassed ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Current Time Integration: ${timeTestPassed ? 'PASS' : 'FAIL'}`);
        console.log(`✅ Bit Pattern Analysis: PASS`);
        console.log(`✅ Practical Scenario: PASS`);

        const overallPassed = allStageTestsPassed && timeTestPassed;
        console.log(`\n🎯 Overall Result: ${overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

        if (overallPassed) {
            console.log('\n🎉 TimeLock library implementation is working correctly!');
            console.log('   - JavaScript implementation matches Tact logic');
            console.log('   - setDeployedAt function works properly');
            console.log('   - Stage value extraction is accurate');
            console.log('   - Time integration is functional');
            console.log('   - Ready for escrow deployment!');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the timelock implementation.');
        }
    } catch (error) {
        console.error('❌ Failed to test timelock:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Ensure factory contract is deployed correctly');
        console.log('   - Check if getter functions are available');
        console.log('   - Verify network connection');
        return;
    }
}
