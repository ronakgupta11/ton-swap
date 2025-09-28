"use client"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mainnet, sepolia } from 'wagmi/chains'
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
import {TonConnectUIProvider} from '@tonconnect/ui-react';

export const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
    chains: [mainnet, polygon, optimism, arbitrum, base,sepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
        <TonConnectUIProvider manifestUrl="https://ton-swap-seven.vercel.app/tonconnect-manifest.json">
        {children}
    </TonConnectUIProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
