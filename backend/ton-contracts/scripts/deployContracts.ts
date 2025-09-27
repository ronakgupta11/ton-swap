import { toNano } from '@ton/core';
import { LimitOrderProtocol } from '../build/Lop/Lop_LimitOrderProtocol';
import { EscrowFactory } from '../build/EscrowFactory/EscrowFactory_EscrowFactory';
import { Escrow } from '../build/EscrowFactory/EscrowFactory_Escrow';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';  
import { Cell } from '@ton/core';

async function deployContracts() {
    console.log('🚀 Deploying TON LOP Contracts');
    
    // Create blockchain instance
    let blockchain = await Blockchain.create();
    
    // Get deployer
    let deployer = await blockchain.treasury('deployer');
    console.log('📋 Deployer:', deployer.address);
    
    // Deploy Escrow contract code
    console.log('\n🏗️  Preparing Escrow contract code...');
    let escrowCode = await Escrow.fromInit(deployer.address, 0n, 0n, 0n, deployer.address);
    
    // Deploy LOP contract
    console.log('📦 Deploying LOP contract...');
    let lop = blockchain.openContract(await LimitOrderProtocol.fromInit(deployer.address));
    
    const lopDeployResult = await lop.send(
        deployer.getSender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    console.log('✅ LOP deployed at:', lop.address);

    // Deploy EscrowFactory
    console.log('📦 Deploying EscrowFactory contract...');
    let factory = blockchain.openContract(await EscrowFactory.fromInit(deployer.address, escrowCode.init!.code));
    
    const factoryDeployResult = await factory.send(
        deployer.getSender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    console.log('✅ EscrowFactory deployed at:', factory.address);

    // Set factory address in LOP
    console.log('\n🔗 Setting up contract relationships...');
    await lop.send(
        deployer.getSender(),
        {
            value: toNano('0.01'),
        },
        {
            $$type: 'SetFactory',
            factory: factory.address,
        }
    );
    console.log('✅ LOP factory address set');

    // Set LOP address in factory
    await factory.send(
        deployer.getSender(),
        {
            value: toNano('0.01'),
        },
        {
            $$type: 'SetLop',
            lop: lop.address,
        }
    );
    console.log('✅ Factory LOP address set');

    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    let lopOwner = await lop.getGetOwner();
    let lopFactory = await lop.getGetFactory();
    let factoryOwner = await factory.getGetOwner();
    let factoryLop = await factory.getGetLop();
    
    console.log('LOP Owner:', lopOwner);
    console.log('LOP Factory:', lopFactory);
    console.log('Factory Owner:', factoryOwner);
    console.log('Factory LOP:', factoryLop);

    console.log('\n🎉 Deployment Complete!');
    console.log('\n📋 Contract Addresses:');
    console.log('  LOP:', lop.address);
    console.log('  EscrowFactory:', factory.address);
    
    console.log('\n⚠️  Important Notes:');
    console.log('  - Signature verification (recoverSigner) is not implemented yet');
    console.log('  - Contracts are ready for testing once signature verification is added');
    console.log('  - Use testCompleteLopFlow.ts for comprehensive testing');
    
    return {
        lop: lop.address,
        factory: factory.address,
        lopContract: lop,
        factoryContract: factory
    };
}

// Export for use in other scripts
export { deployContracts };

// Run if called directly
if (require.main === module) {
    deployContracts().catch(console.error);
}
