import { handleTonToEvmOrder } from './handle-swap';
import { generateTonToEvmOrderParams } from './tonUtils';

/**
 * Example usage of TON to EVM order creation with real TON Connect
 */
export async function createTonToEvmSwapExample(
  tonConnectUI: any,
  tonWallet: any
) {
  try {
    // Example parameters
    const makerSrcAddress = tonWallet?.account?.address || "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"; // TON address
    const makerDstAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // EVM address
    const fromAmount = "1.5"; // TON amount
    const toAmount = "1000000000000000000"; // EVM amount in wei (1 ETH)
    const toToken = "0x0000000000000000000000000000000000000000"; // ETH address
    
    // Generate order parameters
    const orderParams = generateTonToEvmOrderParams(
      makerSrcAddress,
      makerDstAddress,
      fromAmount,
      toAmount,
      toToken,
      30 // 30 minutes expiration
    );
    
    console.log('📋 Generated order parameters:', orderParams);
    
    // Add TON Connect instances
    const orderParamsWithTonConnect = {
      ...orderParams,
      tonConnectUI,
      tonWallet
    };
    
    // Create the order
    const result = await handleTonToEvmOrder(orderParamsWithTonConnect);
    
    console.log('✅ Order created successfully:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to create TON to EVM order:', error);
    throw error;
  }
}

/**
 * Example of how to integrate with the swap interface
 */
export function integrateWithSwapInterface(tonConnectUI: any, tonWallet: any) {
  // This would be called from the SwapInterface component
  // when user selects TON to EVM direction and clicks "Create Order"
  
  return {
    createOrder: async (params: {
      fromAmount: string;
      toAmount: string;
      makerSrcAddress: string;
      makerDstAddress: string;
      toToken: string;
    }) => {
      const orderParams = generateTonToEvmOrderParams(
        params.makerSrcAddress,
        params.makerDstAddress,
        params.fromAmount,
        params.toAmount,
        params.toToken
      );
      
      // Add TON Connect instances
      const orderParamsWithTonConnect = {
        ...orderParams,
        tonConnectUI,
        tonWallet
      };
      
      return await handleTonToEvmOrder(orderParamsWithTonConnect);
    }
  };
}
