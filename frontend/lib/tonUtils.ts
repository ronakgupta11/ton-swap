import { Address, Cell, beginCell, contractAddress, StateInit, storeStateInit } from '@ton/core';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { SendTransactionRequest } from '@tonconnect/sdk';
import crypto from 'crypto';
import { keccak256 } from 'js-sha3';

// TON Contract Addresses
export const TON_ADDRESSES = {
  // Testnet addresses - update with actual deployed addresses
  limitOrderProtocol: "kQAHiPGm7xlsm6eojaI74vJxIi-JZxzhZN9wRHVLYC9EWR6c",
  escrowFactory: "kQChK8yymEMgcjGOcdDx2JM9taiwaN-pfCZ9iLAqN13x8Up_",
  // Mainnet addresses would go here
  mainnet: {
    limitOrderProtocol: "",
    escrowFactory: ""
  }
};

// TON Network Configuration
export const TON_NETWORK = {
  testnet: "https://testnet.toncenter.com/api/v2/jsonRPC",
  mainnet: "https://toncenter.com/api/v2/jsonRPC"
};

// Order structure for TON LOP contract
export interface TonOrder {
  maker: Address;
  makerAsset: Address | null; // null for TON native
  takerAsset: Address;
  makingAmount: bigint;
  takingAmount: bigint;
  receiver: Address;
  hashlock: bigint;
  salt: bigint;
}

// PreInteraction message structure
export interface PreInteractionMessage {
  order: TonOrder;
  signature: Cell;
  makerPublicKey: bigint;
}

/**
 * Hash an order for TON LOP contract
 * This matches the hashOrder function in Lop.tact
 */
export function hashTonOrder(order: TonOrder): bigint {
  console.log('hashTonOrder - makingAmount:', order.makingAmount, 'bits:', order.makingAmount.toString(2).length);
  console.log('hashTonOrder - takingAmount:', order.takingAmount, 'bits:', order.takingAmount.toString(2).length);
  console.log('hashTonOrder - hashlock:', order.hashlock, 'bits:', order.hashlock.toString(2).length);
  console.log('hashTonOrder - salt:', order.salt, 'bits:', order.salt.toString(2).length);
  
  // Split into multiple cells to avoid combined storage overflow
  // Cell 1: Basic order info
  const cell1 = beginCell()
    .storeAddress(order.maker)
    .storeUint(order.makerAsset === null ? 0 : 1, 1) // 1 bit flag
    .storeAddress(order.takerAsset)
    .endCell();
  
  // Cell 2: Amounts
  const cell2 = beginCell()
    .storeCoins(order.makingAmount)
    .storeCoins(order.takingAmount)
    .endCell();
  
  // Cell 3: Receiver and hashlock/salt
  const cell3 = beginCell()
    .storeAddress(order.receiver)
    .storeUint(order.hashlock, 256)
    .storeUint(order.salt, 256)
    .endCell();
  
  // Combine cells with references (max 4 refs per cell)
  const finalCell = beginCell()
    .storeRef(cell1)
    .storeRef(cell2)
    .storeRef(cell3)
    .endCell();
  
  // Hash the cell
  const cellHash = finalCell.hash();
  return BigInt('0x' + cellHash.toString('hex'));
}

/**
 * Create a signature cell for TON using TON Connect
 * This will be used to sign the order hash
 */
export function createTonSignatureCell(signature: string): Cell {
  // Convert hex signature to bytes
  const signatureBytes = Buffer.from(signature.slice(2), 'hex'); // Remove 0x prefix
  
  return beginCell()
    .storeBuffer(signatureBytes)
    .endCell();
}

/**
 * Extract public key from TON Connect wallet
 */
export function extractPublicKeyFromWallet(wallet: any): bigint {
  if (!wallet?.account?.publicKey) {
    throw new Error('No public key found in wallet');
  }
  
  // Convert hex public key to bigint
  return BigInt('0x' + wallet.account.publicKey);
}

/**
 * Create PreInteraction message cell
 */
export function createPreInteractionMessage(
  order: TonOrder,
  signature: Cell,
  makerPublicKey: bigint
): Cell {
  // Split into multiple cells to avoid combined storage overflow
  // Cell 1: Basic order info
  const cell1 = beginCell()
    .storeUint(0x12345678, 32) // PreInteraction op code
    .storeAddress(order.maker)
    .storeUint(order.makerAsset === null ? 0 : 1, 1) // 1 bit flag
    .storeAddress(order.takerAsset)
    .endCell();
  
  // Cell 2: Amounts
  const cell2 = beginCell()
    .storeCoins(order.makingAmount)
    .storeCoins(order.takingAmount)
    .endCell();
  
  // Cell 3: Receiver, hashlock, and salt
  const cell3 = beginCell()
    .storeAddress(order.receiver)
    .storeUint(order.hashlock, 256)
    .storeUint(order.salt, 256)
    .endCell();
  
  // Cell 4: Public key and signature
  const cell4 = beginCell()
    .storeUint(makerPublicKey, 256)
    .storeRef(signature)
    .endCell();
  
  // Combine cells with references (max 4 refs per cell)
  return beginCell()
    .storeRef(cell1)
    .storeRef(cell2)
    .storeRef(cell3)
    .storeRef(cell4)
    .endCell();
}

/**
 * Convert TON amount to nanotons
 */
export function tonToNano(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e9));
}

/**
 * Convert nanotons to TON
 */
export function nanoToTon(nano: bigint): string {
  return (Number(nano) / 1e9).toString();
}

/**
 * Parse TON address from string
 */
export function parseTonAddress(address: string): Address {
  try {
    return Address.parse(address);
  } catch (error) {
    throw new Error(`Invalid TON address: ${address}`);
  }
}

/**
 * Generate a random salt for order
 */
export function generateSalt(): bigint {
  // Generate a 256-bit random salt
  const randomBytes = crypto.randomBytes(32);
  return BigInt('0x' + Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(''));
}

/**
 * Generate a hashlock from a secret
 */
export function generateHashlock(secret: string): bigint {
  // In production, use proper SHA-256 hashing
  // This is a simplified version
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = keccak256(data);
  return BigInt('0x' + hashBuffer);
}

/**
 * Create a TON client
 */
export function createTonClient(network: 'testnet' | 'mainnet' = 'testnet'): TonClient {
  return new TonClient({
    endpoint: TON_NETWORK[network],
    apiKey: process.env.NEXT_PUBLIC_TON_API_KEY || ''
  });
}

/**
 * Create a TON Connect transaction request for LOP contract
 */
export function createLopTransactionRequest(
  contractAddress: Address,
  message: Cell,
  value: bigint = tonToNano('0.1')
): SendTransactionRequest {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes (TON Connect limit)
    messages: [
      {
        address: contractAddress.toString(),
        amount: value.toString(),
        payload: message.toBoc().toString('base64')
      }
    ]
  };
}

/**
 * Send a message to TON LOP contract using TON Connect
 */
export async function sendToLopContractWithTonConnect(
  tonConnectUI: any,
  contractAddress: Address,
  message: Cell,
  value: bigint = tonToNano('0.1')
): Promise<string> {
  const transactionRequest = createLopTransactionRequest(contractAddress, message, value);
  
  console.log('Sending transaction to LOP contract:', {
    contractAddress: contractAddress.toString(),
    message: message.toBoc().toString('base64'),
    value: nanoToTon(value)
  });
  
  try {
    const result = await tonConnectUI.sendTransaction(transactionRequest);
    console.log('Transaction sent successfully:', result);
    return result.boc;
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}

/**
 * Generate order parameters for TON to EVM swap
 */
export function generateTonToEvmOrderParams(
  makerSrcAddress: string,
  makerDstAddress: string,
  fromAmount: string,
  toAmount: string,
  toToken: string,
  expiresInMinutes: number = 30
): {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  makerDstAddress: string;
  hashlock: string;
  salt: string;
  expiresAt: Date;
} {
  const salt = generateSalt();
  const secret = `secret_${Date.now()}_${salt}`;
  const hashlock = generateHashlock(secret);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  
  return {

    fromToken: 'TON', // TON native
    toToken,
    fromAmount,
    toAmount,
    makerDstAddress,
    hashlock: hashlock.toString(16),
    salt: salt.toString(16),
    expiresAt
  };
}
