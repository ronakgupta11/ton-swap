# TON Testnet Setup Guide

## Quick Start for Testnet

### 1. Environment Setup

Create `.env` file in `backend/ton-contracts/`:
```env
# Your 24-word mnemonic phrase (use testnet wallet)
MNEMONIC="your 24-word mnemonic phrase here"

# Get API key from https://toncenter.com/
TON_API_KEY="your_toncenter_api_key_here"
```

### 2. Get Testnet TON

1. Visit [TON Testnet Faucet](https://testnet.toncenter.com/)
2. Enter your wallet address
3. Request testnet TON (you'll get ~5 TON)

### 3. Update Configuration

Edit `testnet-config.ts`:
```typescript
export const testnetConfig: SwapConfig = {
    // TON side (testnet)
    factoryAddress: 'EQAaV93zFP0O6AjtjOGVWQvsknR3EfGm6EA3FLh8KE2vH5lm', // Replace with actual testnet factory
    jettonMaster: undefined, // For native TON
    amount: 1, // 1 TON
    
    // EVM side (testnet)
    evmChainId: 11155111, // Sepolia testnet
    evmTokenAddress: undefined, // For native ETH
    evmRecipientAddress: '0x51aa94BC132221A1924977499ceb50A8FE0CfAfe', // Your testnet address
    
    // Swap parameters
    orderId: BigInt(Date.now()),
    timelockSeconds: 3600, // 1 hour
};
```

### 4. Run the Script

```bash
cd backend/ton-contracts
npx ts-node scripts/swap/tonToEvm.ts
```

## Testnet Resources

### TON Testnet
- **Explorer**: https://testnet.tonscan.org/
- **Faucet**: https://testnet.toncenter.com/
- **RPC**: https://testnet.toncenter.com/api/v2/jsonRPC
- **Docs**: https://docs.ton.org/develop/smart-contracts/environment/testnet

### Sepolia Testnet (EVM)
- **Explorer**: https://sepolia.etherscan.io/
- **Faucet**: https://sepoliafaucet.com/
- **Chain ID**: 11155111
- **Docs**: https://docs.ethereum.org/en/developers/docs/networks/#sepolia

## Important Notes

1. **Use Testnet Wallets**: Never use mainnet wallets for testnet
2. **Get Testnet Tokens**: Use faucets to get testnet TON and ETH
3. **Update Addresses**: Replace placeholder addresses with actual testnet contract addresses
4. **Monitor Transactions**: Use testnet explorers to track transactions

## Troubleshooting

### Common Issues

1. **"Insufficient balance"**
   - Get testnet TON from faucet
   - Check wallet balance on testnet explorer

2. **"Contract not found"**
   - Verify testnet contract addresses
   - Ensure contracts are deployed on testnet

3. **"Transaction failed"**
   - Check gas fees
   - Verify network connectivity
   - Check transaction on testnet explorer

### Getting Help

- Check transactions on https://testnet.tonscan.org/
- Verify contract states
- Monitor for events and logs
- Test with small amounts first
