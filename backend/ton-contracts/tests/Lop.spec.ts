import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Lop } from '../build/Lop/Lop_Lop';
import '@ton/test-utils';

describe('Lop', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let lop: SandboxContract<Lop>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        lop = blockchain.openContract(await Lop.fromInit());

        deployer = await blockchain.treasury('deployer');

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
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and lop are ready to use
    });
});
