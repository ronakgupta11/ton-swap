import { SwapConfig } from './tonToEvm';

// Testnet configuration for TON to EVM swaps
export const testnetConfig: SwapConfig = {
    // TON side (testnet)
    factoryAddress: '0x93645a4F513B846f4F1A3A66dd72Ad1fae4dB0fC', // Replace with actual testnet factory address
    jettonMaster: undefined, // Set to undefined for native TON, or provide testnet jetton master address
    amount: 1, // Amount to swap (in TON or jetton units)
    
    // EVM side (testnet)
    evmChainId: 11155111, // Sepolia testnet (chain ID: 11155111)
    evmTokenAddress: undefined, // Set to undefined for native ETH, or provide testnet ERC20 address
    evmRecipientAddress: '0x51aa94BC132221A1924977499ceb50A8FE0CfAfe', // Replace with your testnet address
    
    // Swap parameters
    orderId: BigInt(Date.now()), // Use timestamp as order ID
    timelockSeconds: 3600, // 1 hour timelock
};

// Alternative testnet configurations
export const testnetConfigs = {
    // Native TON to Native ETH (Sepolia)
    tonToEth: {
        ...testnetConfig,
        jettonMaster: undefined,
        evmTokenAddress: undefined,
    },
    
    // TON to USDC (Sepolia) - if you have testnet USDC
    tonToUsdc: {
        ...testnetConfig,
        jettonMaster: undefined,
        evmTokenAddress: '0xA0b86a33E6441b8c4C8C0d1B4C8a8E8a8E8a8E8a', // Replace with Sepolia USDC address
    },
    
    // Jetton to ETH (Sepolia) - if you have testnet jetton
    jettonToEth: {
        ...testnetConfig,
        jettonMaster: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Replace with testnet jetton master
        evmTokenAddress: undefined,
    },
};

// Testnet contract addresses (update these with actual deployed addresses)
export const testnetAddresses = {
    // TON testnet
    factory: '0x93645a4F513B846f4F1A3A66dd72Ad1fae4dB0fC', // Replace with actual testnet factory
    usdtJetton: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Replace with testnet USDT jetton master
    
    // EVM testnet (Sepolia)
    evmFactory: '0x93645a4F513B846f4F1A3A66dd72Ad1fae4dB0fC', // Replace with actual Sepolia factory address
    usdc: '0xA0b86a33E6441b8c4C8C0d1B4C8a8E8a8E8a8E8a', // Replace with Sepolia USDC address
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Replace with Sepolia WETH address
};

// Testnet RPC endpoints
export const testnetRpc = {
    ton: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    sepolia: 'https://sepolia.infura.io/v3/87714e676b7548908244531650b54d66',
    goerli: 'https://goerli.infura.io/v3/87714e676b7548908244531650b54d66',
};

// Testnet faucets and resources
export const testnetResources = {
    ton: {
        faucet: 'https://testnet.toncenter.com/',
        explorer: 'https://testnet.tonscan.org/',
        docs: 'https://docs.ton.org/develop/smart-contracts/environment/testnet',
    },
    sepolia: {
        faucet: 'https://sepoliafaucet.com/',
        explorer: 'https://sepolia.etherscan.io/',
        docs: 'https://docs.ethereum.org/en/developers/docs/networks/#sepolia',
    },
};
