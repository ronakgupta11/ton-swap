"use client"
import { WagmiProvider } from 'wagmi'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mainnet } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';

const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
        
      <QueryClientProvider client={queryClient}>
        <TonConnectUIProvider>
        <RainbowKitProvider>
        {children}
        </RainbowKitProvider>
        </TonConnectUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
