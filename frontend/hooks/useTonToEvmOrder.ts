import { useState, useCallback } from 'react';
import { useTonConnectUI, useTonWallet,useTonAddress } from '@tonconnect/ui-react';
import { handleTonToEvmOrder } from '@/lib/handle-swap';
import { generateTonToEvmOrderParams } from '@/lib/tonUtils';


interface UseTonToEvmOrderReturn {
  createOrder: (params: {
    makerSrcAddress: string;
    fromAmount: string;
    toAmount: string;
    makerDstAddress: string;
    toToken: string;
    expiresInMinutes?: number;
  }) => Promise<{
    signature: string;
    orderHash: string;
    makerPublicKey: string;
    txHash: string;
    orderId: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

export function useTonToEvmOrder(): UseTonToEvmOrderReturn {
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (params: {
    makerSrcAddress: string;
    fromAmount: string;
    toAmount: string;
    makerDstAddress: string;
    toToken: string;
    expiresInMinutes?: number;
  }) => {
    if (!tonWallet) {
      throw new Error('TON wallet not connected');
    }

    if (!tonConnectUI) {
      throw new Error('TON Connect UI not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate that we have a proper TON address
      if (!params.makerSrcAddress || params.makerSrcAddress.startsWith('0x')) {
        throw new Error('Invalid TON wallet address. Please ensure TON wallet is properly connected.');
      }
      
      // Generate order parameters
      const orderParams = generateTonToEvmOrderParams(
        params.makerSrcAddress,
        params.makerDstAddress,
        params.fromAmount,
        params.toAmount,
        params.toToken,
        params.expiresInMinutes || 30
      );

      // Add TON Connect instances
      const orderParamsWithTonConnect = {
        ...orderParams,
        makerSrcAddress: params.makerSrcAddress,
        tonConnectUI,
        tonWallet,
      };

      // Create the order
      const result = await handleTonToEvmOrder(orderParamsWithTonConnect);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tonConnectUI, tonWallet]);

  return {
    createOrder,
    isLoading,
    error
  };
}
