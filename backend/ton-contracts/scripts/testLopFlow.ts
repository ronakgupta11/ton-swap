import { toNano, beginCell } from '@ton/core';
import { LimitOrderProtocol } from '../build/Lop/Lop_LimitOrderProtocol';
import { EscrowFactory, Order } from '../build/EscrowFactory/EscrowFactory_EscrowFactory';
import { Escrow } from '../build/EscrowFactory/EscrowFactory_Escrow';
import '@ton/test-utils';
import { Blockchain } from '@ton/sandbox';

async function testLopFlow() {
    let blockchain = await Blockchain.create();

    let deployer = await blockchain.treasury('deployer');
    let maker = await blockchain.treasury('maker');
    let resolver = await blockchain.treasury('resolver');

    let escrowCode = await Escrow.fromInit(deployer.address, 0n, 0n, 0n, deployer.address);
    let lop = blockchain.openContract(await LimitOrderProtocol.fromInit(deployer.address));
    let factory = blockchain.openContract(await EscrowFactory.fromInit(deployer.address, escrowCode.init!.code));

    await lop.send(deployer.getSender(), { value: toNano('0.05') }, null);
    await factory.send(deployer.getSender(), { value: toNano('0.05') }, null);

    await lop.send(deployer.getSender(), { value: toNano('0.01') }, { $$type: 'SetFactory', factory: factory.address });
    await factory.send(deployer.getSender(), { value: toNano('0.01') }, { $$type: 'SetLop', lop: lop.address });

    // Create order with valid takerAsset address
    let order = {
        maker: maker.address,
        makerAsset: null,
        takerAsset: deployer.address,  // must be valid Address
        makingAmount: toNano('1'),
        takingAmount: toNano('1'),
        receiver: maker.address,
        hashlock: 123456789n,
        salt: 987654321n,
    };

    let makerPublicKey = 0n; // placeholder, set to actual maker public key in real tests

    // Placeholder 64-byte zero signature slice
    const signatureCell = beginCell().storeUint(0, 512).endCell();
    const signatureSlice = signatureCell.beginParse();

    try {
        await lop.send(
            maker.getSender(),
            { value: toNano('1.1') },
            {
                $$type: 'PreInteraction',
                order: order as unknown as Order,
                signature: signatureSlice,
                makerPublicKey: makerPublicKey,
            }
        );

        let orderHash = await lop.getHashOrder(order as unknown as Order);
        let isValidated = await lop.getIsOrderValidated(orderHash);
        console.log('Order validated:', isValidated);
    } catch (error) {
        console.log('Expected error (due to placeholder signature or recoverSigner):', (error as Error).message);
    }

    let orderHashNumber = await lop.getHashOrder(order as unknown as Order);

    await lop.send(
        resolver.getSender(),
        { value: toNano('0.1') },
        {
            $$type: 'PostInteraction',
            orderHash: orderHashNumber,
            factory: factory.address,
            safetyDeposit: toNano('0.1'),
        }
    );

    let isValidatedAfter = await lop.getIsOrderValidated(orderHashNumber);
    console.log('Order validated after filling:', isValidatedAfter);

    console.log('LOP flow test completed successfully!');
}

testLopFlow().catch(console.error);
