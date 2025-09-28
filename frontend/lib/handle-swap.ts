import { createOrderHash, signOrder } from "./ethUtils";
import { config } from "@/components/providers";
import { writeContract, readContract, waitForTransactionReceipt } from "@wagmi/core";
import { ADDRESSES } from "@/lib/ethUtils";
import LimitOrderProtocolABI from "@/utils/LimitOrderProtocol.json";
import { 
  TonOrder, 
  hashTonOrder, 
  createPreInteractionMessage, 
  createTonSignatureCell,
  extractPublicKeyFromWallet,
  tonToNano,
  parseTonAddress,
  generateSalt,
  generateHashlock,
  createTonClient,
  sendToLopContractWithTonConnect,
  TON_ADDRESSES
} from "./tonUtils";
import { beginCell } from "@ton/core";

type EvmToTonOrderParams = {
  makerSrcAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  makerDstAddress: string;
  hashlock: string;
  salt: number;
  expiresAt: Date;
};

type TonToEvmOrderParams = {
  makerSrcAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  makerDstAddress: string;
  hashlock: string;
  salt: string;
  expiresAt: Date;
  tonConnectUI: any; // TON Connect UI instance
  tonWallet: any; // TON wallet instance
}

export async function handleTonToEvmOrder({
  makerSrcAddress,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  makerDstAddress,
  hashlock,
  salt,
  expiresAt,
  tonConnectUI,
  tonWallet,
}: TonToEvmOrderParams) {
  try {
    console.log('🚀 Creating TON to EVM order...');

    console.log('makerDstAddress', makerDstAddress);
    console.log('toToken', toToken);
    console.log('fromAmount', fromAmount);
    console.log('toAmount', toAmount);
    console.log('hashlock', hashlock);
    console.log('salt', salt);
    console.log('expiresAt', expiresAt);
    console.log('tonConnectUI', tonConnectUI);
    console.log('tonWallet', tonWallet);
    // Parse TON addresses
    console.log('makerSrcAddress', makerSrcAddress);
    const makerAddress = parseTonAddress(makerSrcAddress);
    
    // For TON to EVM orders:
    // - makerSrcAddress is the TON address (source) - parse as TON
    // - makerDstAddress is the EVM address (destination) - don't parse as TON
    // - toToken is the EVM token address - don't parse as TON
    
    // Use placeholder TON addresses for cross-chain components
    // In production, these would be actual TON contract addresses
    const receiverAddress = parseTonAddress(TON_ADDRESSES.escrowFactory); // Use escrow factory as placeholder
    const takerAssetAddress = parseTonAddress(TON_ADDRESSES.escrowFactory); // Use escrow factory as placeholder
    
    console.log('receiverAddress (placeholder)', receiverAddress);
    console.log('takerAssetAddress (placeholder)', takerAssetAddress);
    
    // Create TON order structure
    const tonOrder: TonOrder = {
      maker: makerAddress,
      makerAsset: null, // TON native
      takerAsset: takerAssetAddress,
      makingAmount: tonToNano(fromAmount),
      takingAmount: BigInt(Math.floor(parseFloat(toAmount) * 1e18)),
      receiver: receiverAddress,
      hashlock: BigInt('0x' + hashlock),
      salt: BigInt('0x' + salt)
    };

    console.log('tonOrder', tonOrder);
    
    // Hash the order
    const orderHash = hashTonOrder(tonOrder);
    console.log('📋 Order hash:', orderHash.toString());
    
    // Extract public key from wallet
    const makerPublicKey = extractPublicKeyFromWallet(tonWallet);
    console.log('🔑 Maker public key:', makerPublicKey.toString());
    
    // Create a message to sign (order hash as hex string)
    const messageToSign = orderHash.toString(16).padStart(64, '0');
    console.log('📝 Message to sign:', messageToSign);
    
    // Create a cell with the order hash for signing
    const messageCell = beginCell()
      .storeUint(0x12345678, 32) // PreInteraction op code
      .storeUint(orderHash, 256)
      .endCell();
    
    // Request signature from TON Connect
    const signatureRequest = {
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes (TON Connect limit)
      messages: [
        {
          address: makerAddress.toString(),
          amount: '0', // No TON transfer, just signing
          payload: messageCell.toBoc().toString('base64')
        }
      ]
    };
    
    console.log('✍️ Requesting signature from TON Connect...');
    const signatureResult = await tonConnectUI.sendTransaction(signatureRequest);
    console.log('✅ Signature received:', signatureResult);
    
    // Create signature cell from the received signature
    const signature = createTonSignatureCell(signatureResult.boc);
    
    // Create PreInteraction message
    const preInteractionMessage = createPreInteractionMessage(
      tonOrder,
      signature,
      makerPublicKey
    );
    
    // Send to LOP contract
    const lopAddress = parseTonAddress(TON_ADDRESSES.limitOrderProtocol);
    
    console.log('📤 Sending PreInteraction to LOP contract...');
    const txHash = await sendToLopContractWithTonConnect(
      tonConnectUI,
      lopAddress,
      preInteractionMessage,
      tonToNano(fromAmount) // Send TON amount
    );
    
    console.log('✅ PreInteraction completed:', txHash);
    
    // Store order in database
    const orderData = {
      fromChain: 'TON',
      toChain: 'EVM',
      fromToken: 'TON', // TON native
      toToken: toToken,
      fromAmount: fromAmount,
      toAmount: toAmount,
      makerSrcAddress: makerSrcAddress,
      makerDstAddress: makerDstAddress,
      hashlock: hashlock,
      salt: salt,
      orderHash: orderHash.toString(),
      signature: signature.toBoc().toString('base64'),
      expiresAt: expiresAt
    };
    
    // Send to backend API
    const response = await fetch('http://localhost:8000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to store order: ${response.statusText}`);
    }
    
    const storedOrder = await response.json();
    console.log('💾 Order stored in database:', storedOrder.id);
    
    return { 
      signature: signature.toBoc().toString('base64'), 
      orderHash: orderHash.toString(),
      makerPublicKey: makerPublicKey.toString(),
      txHash,
      orderId: storedOrder.id
    };
    
  } catch (error) {
    console.error('❌ Error creating TON to EVM order:', error);
    throw error;
  }
}

export async function handleEvmToTonOrder({
  makerSrcAddress,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  makerDstAddress,
  hashlock,
  salt,
  expiresAt,
}: EvmToTonOrderParams) {

  const order = {
    maker: makerSrcAddress,
    makerAsset: fromToken,
    takerAsset: toToken,
    makingAmount: BigInt(Math.floor(parseFloat(fromAmount) * 1e18)), // Convert to wei (18 decimals)
    takingAmount: BigInt(Math.floor(parseFloat(toAmount) * 1e9)), // Convert to nanotons (9 decimals)
    receiver: "0x0000000000000000000000000000000000000000",
    hashlock: hashlock,
    salt: salt,
  };

  const orderMetadata = {
    adaAmount: BigInt(Math.floor(parseFloat(toAmount) * 1e9)), // Convert to nanotons
    cardanoAddress: makerDstAddress,
    safetyDeposit: 0.01, // Default safety deposit
    deadline: expiresAt,
    createdAt: new Date().toISOString(),
  };

  // Create order hash for EIP-712 signing
  const orderHash = await createOrderHash(order);

  const signedOrderData = {
    ...order,
    ...orderMetadata,
    orderHash: orderHash,
  };

  const signature = await signOrder(signedOrderData);
  // Get the LOP contract using ABI

  if (fromToken === "0x0000000000000000000000000000000000000000") {
    const preInteractionTx = await writeContract(config, {
      abi: LimitOrderProtocolABI.abi,
      address: ADDRESSES.limitOrderProtocol as `0x${string}`,
      functionName: "preInteraction",
      args: [order, signature],
      value: BigInt(Math.floor(parseFloat(fromAmount) * 1e18)), // Convert to wei
    });
    console.log(`📋 Transaction hash: ${preInteractionTx}`);
    console.log(`⏳ Waiting for confirmation...`);
    const receipt = await waitForTransactionReceipt(config, {
      hash: preInteractionTx,
    });
    console.log(`✅ PreInteraction completed in block ${receipt.blockNumber}`);
  } else {
    // Approve token to lop
    const tokenContract = await readContract(config, {
      address: fromToken as `0x${string}`,
      abi: [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ] as any,
      functionName: "approve",
      args: [ADDRESSES.limitOrderProtocol, BigInt(fromAmount)],
    });
    const approveTx = await writeContract(config, {
      address: fromToken as `0x${string}`,
      abi: [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ] as any,
      functionName: "approve",
      args: [ADDRESSES.limitOrderProtocol, BigInt(fromAmount)],
    });
    console.log(`📋 Approve transaction hash: ${approveTx}`);
    console.log(`⏳ Waiting for approval confirmation...`);
    const receipt = await waitForTransactionReceipt(config, {
      hash: approveTx,
    });
    console.log(`✅ Token approved in block ${receipt.blockNumber}`);

    // Now call preInteraction
    const preInteractionTx = await writeContract(config, {
      address: ADDRESSES.limitOrderProtocol as `0x${string}`,
      abi: LimitOrderProtocolABI.abi,
      functionName: "preInteraction",
      args: [order, signature],
    });
    console.log(`📋 Transaction hash: ${preInteractionTx}`);
    console.log(`⏳ Waiting for confirmation...`);
    const preReceipt = await waitForTransactionReceipt(config, {
      hash: preInteractionTx,
    });
    console.log(
      `✅ PreInteraction completed in block ${preReceipt.blockNumber}`
    );
  }

  // Store order in database
  const orderData = {
    fromChain: 'EVM',
    toChain: 'TON',
    makerSrcAddress: makerSrcAddress,
    makerDstAddress: makerDstAddress,
    hashlock: hashlock,
    salt: salt,
    orderHash: orderHash,
    signature: signature,
    expiresAt: expiresAt,
    fromToken: fromToken,
    toToken: toToken,
    fromAmount: fromAmount,
    toAmount: toAmount,
  };

  // Send to backend API
  const response = await fetch('http://localhost:8000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error(`Failed to store order: ${response.statusText}`);
  }

  const storedOrder = await response.json();
  console.log('💾 Order stored in database:', storedOrder.id);

  return { signature, orderHash };
}


