import { ethers } from 'hardhat';
import { Contract, Wallet } from 'ethers';
import { keccak256 } from 'js-sha3';
import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

interface EvmToTonConfig {
    // EVM side
    factoryAddress: string;
    tokenAddress?: string; // ERC20 token address, undefined for native ETH
    amount: string; // Amount to swap (in wei or token units)
    
    // TON side
    tonRecipientAddress: string; // TON address to receive tokens
    tonChainId: number; // TON chain ID (usually 0)
    
    // Swap parameters
    orderId: string;
    timelockSeconds: number; // How long before public withdrawal
}

interface SwapResult {
    escrowAddress: string;
    secret: string;
    hashLock: string;
    transactionHash: string;
}

function generateSecret(): { secret: string; hashLock: string } {
    const secretBytes = randomBytes(32);
    const secret = '0x' + secretBytes.toString('hex');
    const hashLock = '0x' + keccak256(secretBytes);
    
    return { secret, hashLock };
}

function encodeTonAddress(tonAddress: string): string {
    // Convert TON address to bytes32 for EVM storage
    // This is a simplified encoding - you might need more sophisticated encoding
    const cleanAddress = tonAddress.replace(/^EQ/, '');
    const addressBytes = Buffer.from(cleanAddress, 'base64');
    return '0x' + addressBytes.toString('hex').padStart(64, '0');
}

function createExtraData(tonRecipient: string): string {
    const encodedTonAddress = encodeTonAddress(tonRecipient);
    const randomData = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Pack: tonAddress (32 bytes) + randomData (32 bytes) = 64 bytes total
    return encodedTonAddress + randomData.slice(2);
}

async function performEvmToTonSwap(config: EvmToTonConfig): Promise<SwapResult> {
    console.log('🔄 Starting EVM to TON Swap\n');
    console.log('Configuration:', {
        amount: config.amount,
        tonRecipient: config.tonRecipientAddress,
        orderId: config.orderId,
        timelockSeconds: config.timelockSeconds,
        tokenAddress: config.tokenAddress || 'Native ETH'
    });

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log('👛 Signer Address:', signer.address);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log('💰 ETH Balance:', ethers.formatEther(balance), 'ETH');

    // Generate secret and hash lock
    const { secret, hashLock } = generateSecret();
    console.log('🔐 Secret (hex):', secret);
    console.log('🔒 Hash Lock:', hashLock);

    // Load factory contract
    const factory = await ethers.getContractAt('EscrowFactory', config.factoryAddress);
    console.log('🏭 Factory Address:', config.factoryAddress);

    // Create timelock state (same format as TON side)
    const timelockState = BigInt(config.timelockSeconds) << BigInt(5 * 32); // dstPublicWithdrawal
    console.log('⏰ TimeLock State:', '0x' + timelockState.toString(16));

    // Create extra data for TON
    const extraData = createExtraData(config.tonRecipientAddress);
    console.log('📦 Extra Data created for TON recipient:', config.tonRecipientAddress);

    // Prepare immutables for escrow creation
    const immutables = {
        orderHash: ethers.keccak256(ethers.toUtf8Bytes(config.orderId)),
        hashlock: hashLock,
        maker: signer.address,
        taker: '0x0000000000000000000000000000000000000000', // Will be set by TON side
        token: config.tokenAddress || '0x0000000000000000000000000000000000000000',
        amount: config.amount,
        safetyDeposit: ethers.parseEther('0.01'), // 0.01 ETH safety deposit
        timelocks: timelockState
    };

    console.log('\n📊 Immutables:', {
        orderHash: immutables.orderHash,
        hashlock: immutables.hashlock,
        maker: immutables.maker,
        token: immutables.token,
        amount: immutables.amount,
        safetyDeposit: ethers.formatEther(immutables.safetyDeposit)
    });

    // Get escrow address before deployment
    const escrowAddress = await factory.addressOfEscrowSrc(immutables);
    console.log('🏦 Escrow Address (predicted):', escrowAddress);

    let tx;
    const value = config.tokenAddress 
        ? immutables.safetyDeposit // Only safety deposit for ERC20
        : BigInt(immutables.amount) + immutables.safetyDeposit; // Amount + safety deposit for ETH

    if (config.tokenAddress) {
        // ERC20 token swap
        console.log('🪙 Performing ERC20 token swap...');
        
        // First, approve the factory to spend tokens
        const token = await ethers.getContractAt('IERC20', config.tokenAddress);
        const approveTx = await token.approve(escrowAddress, config.amount);
        console.log('📝 Approval transaction:', approveTx.hash);
        await approveTx.wait();
        console.log('✅ Token approval confirmed');

        // Create escrow with ERC20 tokens
        tx = await factory.createSrcEscrow(immutables, { value: immutables.safetyDeposit });
        
    } else {
        // Native ETH swap
        console.log('💎 Performing native ETH swap...');
        tx = await factory.createSrcEscrow(immutables, { value: value });
    }

    console.log('\n📤 Sending escrow creation transaction...');
    console.log('Transaction hash:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt?.blockNumber);

    // Check escrow state
    console.log('\n🔍 Checking escrow state...');
    try {
        const escrow = await ethers.getContractAt('EscrowSrc', escrowAddress);
        const isInitialized = await escrow.isInitialized();
        console.log('🏦 Escrow Initialized:', isInitialized);

        if (isInitialized) {
            const escrowData = await escrow.getData();
            console.log('\n📊 Escrow Data:');
            console.log('  Order Hash:', escrowData.orderHash);
            console.log('  Hash Lock:', escrowData.hashlock);
            console.log('  Maker:', escrowData.maker);
            console.log('  Amount:', escrowData.amount.toString());
            console.log('  Token:', escrowData.token);
        }
    } catch (error) {
        console.log('❌ Could not read escrow state:', error);
    }

    console.log('\n🎉 EVM to TON swap initiated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Wait for the TON side to complete the swap');
    console.log('2. Use the secret to withdraw on TON side:', secret);
    console.log('3. Or wait for timelock expiration for public withdrawal');
    console.log('\n🔗 Escrow Address:', escrowAddress);
    console.log('🔐 Secret (hex):', secret);
    console.log('🔒 Hash Lock:', hashLock);

    return {
        escrowAddress,
        secret,
        hashLock,
        transactionHash: tx.hash
    };
}

// Withdrawal function for EVM side
async function withdrawFromEvmEscrow(
    escrowAddress: string, 
    secret: string
): Promise<void> {
    console.log('💰 Withdrawing from EVM escrow...');
    
    const [signer] = await ethers.getSigners();
    const escrow = await ethers.getContractAt('EscrowSrc', escrowAddress);
    
    // Convert hex secret to bytes32
    const secretBytes = ethers.getBytes(secret);
    
    const tx = await escrow.withdraw(secretBytes);
    console.log('📤 Withdrawal transaction:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Withdrawal confirmed in block:', receipt?.blockNumber);
}

// Example usage
async function main() {
    const config: EvmToTonConfig = {
        // EVM side
        factoryAddress: '0x...', // Replace with actual factory address
        tokenAddress: '0xA0b86a33E6441b8c4C8C0d1B4C8a8E8a8E8a8E8a', // USDC, set to undefined for ETH
        amount: ethers.parseUnits('1', 6).toString(), // 1 USDC (6 decimals), or ethers.parseEther('1') for ETH
        
        // TON side
        tonRecipientAddress: 'EQAaV93zFP0O6AjtjOGVWQvsknR3EfGm6EA3FLh8KE2vH5lm',
        tonChainId: 0,
        
        // Swap parameters
        orderId: Date.now().toString(),
        timelockSeconds: 3600, // 1 hour
    };

    const result = await performEvmToTonSwap(config);
    
    // Example of how to withdraw later
    // await withdrawFromEvmEscrow(result.escrowAddress, result.secret);
}

if (require.main === module) {
    main().catch(console.error);
}

export { performEvmToTonSwap, withdrawFromEvmEscrow, EvmToTonConfig, SwapResult };
