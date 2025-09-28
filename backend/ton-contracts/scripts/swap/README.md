# TON ↔ EVM Atomic Swap Scripts

This directory contains scripts for performing atomic swaps between TON and EVM chains.

## Overview

The atomic swap system consists of:
- **TON Side**: Uses `EscrowFactory` and `Escrow` contracts to lock TON/jettons
- **EVM Side**: Uses `EscrowFactory`, `EscrowSrc`, and `EscrowDst` contracts to lock ETH/ERC20 tokens
- **Cross-chain Communication**: Uses hash locks and time locks for atomicity

## Scripts

### 1. TON to EVM Swap (`tonToEvm.ts`)

Initiates a swap from TON to EVM chain.

**Features:**
- Supports native TON and jetton swaps
- Generates secret and hash lock
- Creates escrow on TON side
- Includes EVM recipient information in extra data

**Usage:**
```bash
cd backend/ton-contracts
npx ts-node scripts/swap/tonToEvm.ts
```

**Configuration:**
```typescript
const config: SwapConfig = {
    // TON side
    factoryAddress: 'EQAaV93zFP0O6AjtjOGVWQvsknR3EfGm6EA3FLh8KE2vH5lm',
    jettonMaster: 'EQBX6K9aXVl3nXINCyPPL86C4ONVmQ8vK360u6dykFKXpHCa', // USDT, undefined for native TON
    amount: 1, // Amount to swap
    
    // EVM side
    evmChainId: 1, // Ethereum mainnet
    evmTokenAddress: '0xA0b86a33E6441b8c4C8C0d1B4C8a8E8a8E8a8E8a', // USDC, undefined for ETH
    evmRecipientAddress: '0x51aa94BC132221A1924977499ceb50A8FE0CfAfe',
    
    // Swap parameters
    orderId: BigInt(Date.now()),
    timelockSeconds: 3600, // 1 hour
};
```

### 2. EVM to TON Swap (`../evm-contracts/scripts/evmToTon.ts`)

Initiates a swap from EVM to TON chain.

**Features:**
- Supports native ETH and ERC20 token swaps
- Generates secret and hash lock
- Creates escrow on EVM side
- Includes TON recipient information in extra data

**Usage:**
```bash
cd backend/evm-contracts
npx hardhat run scripts/evmToTon.ts --network <network>
```

**Configuration:**
```typescript
const config: EvmToTonConfig = {
    // EVM side
    factoryAddress: '0x...', // Factory contract address
    tokenAddress: '0xA0b86a33E6441b8c4C8C0d1B4C8a8E8a8E8a8E8a', // USDC, undefined for ETH
    amount: ethers.parseUnits('1', 6).toString(), // 1 USDC (6 decimals)
    
    // TON side
    tonRecipientAddress: 'EQAaV93zFP0O6AjtjOGVWQvsknR3EfGm6EA3FLh8KE2vH5lm',
    tonChainId: 0,
    
    // Swap parameters
    orderId: Date.now().toString(),
    timelockSeconds: 3600, // 1 hour
};
```

## Environment Setup

### TON Side
Create `.env` file in `backend/ton-contracts/`:
```env
MNEMONIC="your 24-word mnemonic phrase"
TON_API_KEY="your toncenter api key"
```

### EVM Side
Create `.env` file in `backend/evm-contracts/`:
```env
PRIVATE_KEY="your private key"
RPC_URL="https://mainnet.infura.io/v3/your-project-id"
```

## Swap Flow

### TON → EVM Flow
1. **Initiate on TON**: Run `tonToEvm.ts`
   - Generates secret and hash lock
   - Locks TON/jettons in escrow
   - Includes EVM recipient info

2. **Complete on EVM**: Run `evmToTon.ts` (as taker)
   - Uses the same hash lock
   - Locks ETH/ERC20 tokens in escrow
   - Reveals secret to claim TON

3. **Withdraw on TON**: Use existing `withdraw.ts` script
   - Uses the revealed secret
   - Claims ETH/ERC20 tokens

### EVM → TON Flow
1. **Initiate on EVM**: Run `evmToTon.ts`
   - Generates secret and hash lock
   - Locks ETH/ERC20 tokens in escrow
   - Includes TON recipient info

2. **Complete on TON**: Run `tonToEvm.ts` (as taker)
   - Uses the same hash lock
   - Locks TON/jettons in escrow
   - Reveals secret to claim ETH/ERC20

3. **Withdraw on EVM**: Use `withdrawFromEvmEscrow` function
   - Uses the revealed secret
   - Claims TON/jettons

## Security Features

- **Hash Locks**: Prevents premature withdrawal
- **Time Locks**: Allows public withdrawal after timeout
- **Atomicity**: Either both sides complete or neither
- **Secret Revealing**: One side reveals secret, both can withdraw

## Error Handling

The scripts include comprehensive error handling for:
- Insufficient balances
- Transaction failures
- Contract state verification
- Network timeouts

## Monitoring

Both scripts provide detailed logging:
- Transaction hashes and block numbers
- Escrow addresses and states
- Secret and hash lock information
- Next steps for completing the swap

## Testing

Test the scripts on testnets first:
- **TON**: Testnet
- **EVM**: Sepolia, Goerli, or other testnets

## Troubleshooting

### Common Issues
1. **Insufficient Gas**: Ensure adequate TON/ETH for fees
2. **Wrong Addresses**: Verify contract addresses and recipient addresses
3. **Network Issues**: Check RPC endpoints and API keys
4. **Timelock**: Wait for timelock expiration for public withdrawal

### Debugging
- Check transaction on block explorers
- Verify escrow contract states
- Ensure secret and hash lock match
- Monitor for events and logs
