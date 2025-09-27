import { beginCell, Slice, toNano } from '@ton/core';
import { Cell } from '@ton/core';
import { LimitOrderProtocol } from '../build/Lop/Lop_LimitOrderProtocol';
import { EscrowFactory } from '../build/EscrowFactory/EscrowFactory_EscrowFactory';
import { Escrow } from '../build/EscrowFactory/EscrowFactory_Escrow';
import '@ton/test-utils';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Order } from '../build/Lop/Lop_LimitOrderProtocol';

describe('LOP Contracts', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let maker: SandboxContract<TreasuryContract>;
    let resolver: SandboxContract<TreasuryContract>;
    let lop: SandboxContract<LimitOrderProtocol>;
    let factory: SandboxContract<EscrowFactory>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        maker = await blockchain.treasury('maker');
        resolver = await blockchain.treasury('resolver');

        // Deploy contracts
        let escrowCode = await Escrow.fromInit(deployer.address, 0n, 0n, 0n, deployer.address);
        lop = blockchain.openContract(await LimitOrderProtocol.fromInit(deployer.address));
        factory = blockchain.openContract(await EscrowFactory.fromInit(deployer.address, escrowCode.init!.code));
        // Deploy LOP
        await lop.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            null,
        );

        // Deploy Factory
        await factory.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            null,
        );

        // Set addresses
        await lop.send(
            deployer.getSender(),
            { value: toNano('0.01') },
            { $$type: 'SetFactory', factory: factory.address }
        );

        await factory.send(
            deployer.getSender(),
            { value: toNano('0.01') },
            { $$type: 'SetLop', lop: lop.address }
        );
    });

    it('should deploy contracts successfully', async () => {
        expect(lop.address).toBeDefined();
        expect(factory.address).toBeDefined();
    });

    it('should set contract relationships correctly', async () => {
        let lopFactory = await lop.getGetFactory();
        let factoryLop = await factory.getGetLop();
        
        expect(lopFactory).toEqual(factory.address);
        expect(factoryLop).toEqual(lop.address);
    });

    it('should have correct owners', async () => {
        let lopOwner = await lop.getGetOwner();
        let factoryOwner = await factory.getGetOwner();
        
        expect(lopOwner).toEqual(deployer.address);
        expect(factoryOwner).toEqual(deployer.address);
    });

    it('should handle order validation correctly', async () => {
        let orderHash = 123456789n;
        let isValidated = await lop.getIsOrderValidated(orderHash);
        expect(isValidated).toBe(false);
    });

    it('should handle order retrieval correctly', async () => {
        let orderHash = 123456789n;
        let order = await lop.getGetOrder(orderHash);
        expect(order).toBeNull();
    });

    it('should calculate escrow addresses correctly', async () => {
        let orderId = 123456789n;
        let hashLock = 0n;
        let dstChainId = 1n;
        let makerAddress = maker.address;
        
        let escrowAddress = await factory.getGetEscrowAddress(orderId, hashLock, dstChainId, makerAddress);
        expect(escrowAddress).toBeDefined();
    });

    it('should fail preInteraction due to missing signature verification', async () => {
        let order = {
            maker: maker.address,
            makerAsset: null,
            takerAsset: null,
            makingAmount: toNano('1'),
            takingAmount: toNano('1'),
            receiver: maker.address,
            hashlock: 123456789n,
            salt: 987654321n,
        };

        await expect(async () => {
            await lop.send(
                maker.getSender(),
                { value: toNano('1.1') },
                {
                    $$type: 'PreInteraction',
                    order: order as unknown as Order,
                    signature: beginCell().storeUint(0, 256).endCell().beginParse() as Slice,
                }
            );
        }).rejects.toThrow();
    });

    it('should fail postInteraction due to unvalidated order', async () => {
        await expect(async () => {
            await lop.send(
                resolver.getSender(),
                { value: toNano('0.1') },
                {
                    $$type: 'PostInteraction',
                    orderHash: 123456789n,
                    factory: factory.address,
                    safetyDeposit: toNano('0.1'),
                }
            );
        }).rejects.toThrow();
    });
});