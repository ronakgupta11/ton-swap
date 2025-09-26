import { toNano } from '@ton/core';
import { LopOnTon } from '../build/LopOnTon/LopOnTon_LopOnTon';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const lopOnTon = provider.open(await LopOnTon.fromInit(BigInt(Math.floor(Math.random() * 10000)), 0n));

    await lopOnTon.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        null,
    );

    await provider.waitForDeploy(lopOnTon.address);

    console.log('ID', await lopOnTon.getId());
}
