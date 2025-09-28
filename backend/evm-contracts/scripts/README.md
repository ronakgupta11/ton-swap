# EVM Contract Scripts

This directory contains scripts for interacting with EVM-based atomic swap contracts.

## Scripts

### 1. EVM to TON Swap (`evmToTon.ts`)

Initiates a swap from EVM to TON chain using the EscrowFactory contract.

**Features:**
- Supports native ETH and ERC20 token swaps
- Generates secret and hash lock for atomicity
- Creates escrow contract on EVM side
- Includes TON recipient information

**Usage:**
```bash
# Deploy and run on local network
npx hardhat run scripts/evmToTon.ts

# Run on testnet
npx hardhat run scripts/evmToTon.ts --network sepolia

# Run on mainnet
npx hardhat run scripts/evmToTon.ts --network mainnet
```

**Configuration:**
```typescript
const config: EvmToTonConfig = {
    // EVM side
    factoryAddress: '0x...', // Deployed EscrowFactory address
    tokenAddress: '0xA0b86a33E6441b8c4C8C0d1B4C8a8E8a8E8a8E8a', // ERC20 token, undefined for ETH
    amount: ethers.parseUnits('1', 6).toString(), // Amount in token units
    
    // TON side
    tonRecipientAddress: 'EQAaV93zFP0O6AjtjOGVWQvsknR3EfGm6EA3FLh8KE2vH5lm',
    tonChainId: 0,
    
    // Swap parameters
    orderId: Date.now().toString(),
    timelockSeconds: 3600, // 1 hour
};
```

### 2. Withdrawal Script

Withdraws funds from EVM escrow using the revealed secret.

**Usage:**
```typescript
import { withdrawFromEvmEscrow } from './evmToTon';

// Withdraw using secret
await withdrawFromEvmEscrow(escrowAddress, secret);
```

## Environment Setup

Create `.env` file in `backend/evm-contracts/`:
```env
# Private key for signing transactions
PRIVATE_KEY="0x..."

# RPC URLs for different networks
MAINNET_RPC_URL="https://mainnet.infura.io/v3/your-project-id"
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your-project-id"
GOERLI_RPC_URL="https://goerli.infura.io/v3/your-project-id"

# Optional: Etherscan API key for contract verification
ETHERSCAN_API_KEY="your-etherscan-api-key"
```

## Hardhat Configuration

Update `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

## Contract Deployment

Before using the swap scripts, deploy the contracts:

```bash
# Deploy to local network
npx hardhat run scripts/deploy.js

# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet
```

## Testing

Run the test suite:
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/EscrowFactory.test.js

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## Contract Verification

Verify contracts on Etherscan:
```bash
# Verify on testnet
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Verify on mainnet
npx hardhat verify --network mainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Gas Optimization

Monitor gas usage:
```bash
# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Estimate gas for specific function
npx hardhat console
> const factory = await ethers.getContractAt("EscrowFactory", "0x...");
> await factory.estimateGas.createSrcEscrow(immutables, { value: ethers.parseEther("1") });
```

## Security Considerations

1. **Private Key Security**: Never commit private keys to version control
2. **Network Security**: Use secure RPC endpoints
3. **Contract Verification**: Always verify contracts on block explorers
4. **Testing**: Thoroughly test on testnets before mainnet deployment
5. **Access Control**: Ensure proper access controls in contracts

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limit in transaction
2. **Wrong Network**: Verify network configuration
3. **Contract Not Deployed**: Deploy contracts first
4. **Insufficient Balance**: Ensure adequate ETH/token balance
5. **Approval Issues**: Approve token spending before swap

### Debugging

1. **Check Transaction**: Use block explorer to verify transaction
2. **Contract State**: Query contract state using getters
3. **Events**: Monitor contract events for state changes
4. **Gas Estimation**: Use `estimateGas` to check gas requirements

## Integration with TON

The EVM scripts work in conjunction with TON scripts:
1. **EVM → TON**: Use `evmToTon.ts` to initiate, complete on TON side
2. **TON → EVM**: Use TON scripts to initiate, complete with EVM scripts

## Monitoring and Analytics

Track swap activity:
- Monitor contract events
- Use block explorers for transaction history
- Implement off-chain monitoring for failed swaps
- Track gas costs and optimization opportunities
