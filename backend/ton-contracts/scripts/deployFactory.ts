import { toNano, Cell } from '@ton/core';
import { EscrowFactory } from '../build/EscrowFactory/EscrowFactory_EscrowFactory';
import { NetworkProvider } from '@ton/blueprint';
import { readFileSync } from 'fs';
import path from 'path';

export async function run(provider: NetworkProvider) {
    // Get escrow contract code
    const escrowCode = Cell.fromBoc(
        readFileSync(path.join(__dirname, '../build/EscrowFactory/EscrowFactory_Escrow.code.boc')),
    )[0];

    // Deploy factory with owner address and escrow code
    const factory = provider.open(await EscrowFactory.fromInit(provider.sender().address!, escrowCode));

    await factory.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        null,
    );

    await provider.waitForDeploy(factory.address);
    console.log('Factory deployed at:', factory.address);
}
