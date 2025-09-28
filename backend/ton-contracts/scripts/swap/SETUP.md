# Setup Guide for TON ↔ EVM Swap Scripts

## Quick Start

### 1. Environment Setup

#### TON Side Setup
```bash
cd backend/ton-contracts
cp env.example .env
```

Edit `.env` file:
```env
# Your 24-word mnemonic phrase
MNEMONIC="your 24-word mnemonic phrase here"

# Get API key from https://toncenter.com/
TON_API_KEY="your_toncenter_api_key_here"
```

#### EVM Side Setup
```bash
cd backend/evm-contracts
cp env.example .env
```

Edit `.env` file:
```env
# Your private key (without 0x prefix)
PRIVATE_KEY="your_private_key_here"

# RPC URLs
MAINNET_RPC_URL="https://mainnet.infura.io/v3/your-project-id"
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your-project-id"
```

### 2. Install Dependencies

#### TON Side
```bash
cd backend/ton-contracts
npm install
```

#### EVM Side
```bash
cd backend/evm-contracts
npm install
```

### 3. Run Swap Scripts

#### TON to EVM Swap
```bash
cd backend/ton-contracts
npx ts-node scripts/swap/tonToEvm.ts
```

#### EVM to TON Swap
```bash
cd backend/evm-contracts
npx hardhat run scripts/evmToTon.ts --network sepolia
```

## Detailed Configuration

### TON Configuration
- **Factory Address**: Deployed EscrowFactory contract address
- **Jetton Master**: Jetton master contract address (for jetton swaps)
- **Amount**: Amount to swap (in jetton units or TON)
- **EVM Chain ID**: Target EVM chain (1 for Ethereum, 11155111 for Sepolia)
- **EVM Recipient**: Ethereum address to receive tokens
- **Order ID**: Unique identifier for the swap
- **Timelock**: Time before public withdrawal (in seconds)

### EVM Configuration
- **Factory Address**: Deployed EscrowFactory contract address
- **Token Address**: ERC20 token address (undefined for ETH)
- **Amount**: Amount to swap (in wei or token units)
- **TON Recipient**: TON address to receive tokens
- **Order ID**: Unique identifier for the swap
- **Timelock**: Time before public withdrawal (in seconds)

## Security Notes

1. **Never commit private keys or mnemonics to version control**
2. **Use testnets for testing before mainnet**
3. **Verify contract addresses before use**
4. **Keep secrets secure and never share them**

## Troubleshooting

### Common Issues

1. **"MNEMONIC environment variable is required"**
   - Create `.env` file with your mnemonic
   - Ensure file is in the correct directory

2. **"Insufficient balance"**
   - Check wallet balance
   - Ensure adequate funds for gas fees

3. **"Transaction timeout"**
   - Check network connectivity
   - Verify RPC endpoints
   - Increase timeout if needed

4. **"Contract not found"**
   - Verify contract addresses
   - Ensure contracts are deployed
   - Check network configuration

### Getting Help

- Check transaction on block explorers
- Verify contract states
- Monitor for events and logs
- Test on testnets first
