import { toNano, beginCell } from '@ton/core';
import { LimitOrderProtocol } from '../build/Lop/Lop_LimitOrderProtocol';
import { EscrowFactory } from '../build/EscrowFactory/EscrowFactory_EscrowFactory';
import { Escrow } from '../build/EscrowFactory/EscrowFactory_Escrow';
import '@ton/test-utils';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell } from '@ton/core';

async function main() {
    // Create blockchain instance
    let blockchain = await Blockchain.create();
    
    // Get deployer
    let deployer = await blockchain.treasury('deployer');
    
    // Deploy Escrow contract code
    let escrowCode = await Escrow.fromInit(deployer.address, 0n, 0n, 0n, deployer.address);
    
    // Deploy LOP contract
    let lop = blockchain.openContract(await LimitOrderProtocol.fromInit(deployer.address));
    
    const deployResult = await lop.send(
        deployer.getSender(),
        {
            value: toNano('0.05'),
        },
        null,
    );
    

    expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: lop.address,
        deploy: true,
        success: true,
    });

    // Deploy EscrowFactory
    let factory = blockchain.openContract(await EscrowFactory.fromInit(deployer.address, escrowCode.init!.code));
    
    const factoryDeployResult = await factory.send(
        deployer.getSender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    expect(factoryDeployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: factory.address,
        deploy: true,
        success: true,
    });

    // Set factory address in LOP
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

    console.log('LOP deployed at:', lop.address);
    console.log('Factory deployed at:', factory.address);
}

main().catch(console.error);
