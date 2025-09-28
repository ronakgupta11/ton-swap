"use client";

import Link from "next/link"
import { ArrowLeft, Wallet, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTonWallet } from '@tonconnect/ui-react';
import { WalletConnect } from '@/components/wallet-connect';
import { useAccount } from 'wagmi';

export default function ConnectWalletPage() {
  // Get wallet states
  const tonWallet = useTonWallet();
  const { isConnected: evmConnected } = useAccount();
  
  // Check if both wallets are connected
  const bothWalletsConnected = !!tonWallet && evmConnected;
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground hover:text-foreground transition-colors">Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Ultron Swap</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-balance">Connect Your Wallets</h1>
            <p className="text-lg text-muted-foreground text-balance">
              Connect both your Ethereum and TON wallets to start cross-chain swapping with AI optimization.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-primary">Connect Wallets</span>
              </div>
              <div className="w-8 h-px bg-border"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm text-muted-foreground">Set Swap</span>
              </div>
            </div>
          </div>

          {/* Wallet Connection Cards */}
          <div className="space-y-6 mb-8">
            {/* Ethereum Wallet */}
            <Card className="p-6 animated-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ethereum Wallet</h3>
                    <p className="text-sm text-muted-foreground">Connect Wallet to start</p>
                  </div>
                </div>
                <Wallet className="w-4 h-4 mr-2" />
                <ConnectButton />
              </div>
            </Card>

            {/* TON Wallet */}
            <Card className="p-6 animated-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-blue-400"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">TON Wallet</h3>
                    <p className="text-sm text-muted-foreground">Connect TON Wallet or Tonkeeper</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <WalletConnect />
                </div>
              </div>
            </Card>
          </div>

          {/* Next Button */}
          <div className="text-center">
            <Link href="/set-swap">
              <Button
                size="lg"
                className={`${bothWalletsConnected?"":"disabled"}bg-white text-black`}
                disabled={!bothWalletsConnected}
              >
                Next: Set Swap
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className={`text-sm mt-4 ${bothWalletsConnected ? 'text-green-500' : 'text-red-500'}`}>
              {bothWalletsConnected 
                ? "Both wallets connected! You can proceed to set up your swap." 
                : "Connect both wallets to continue"
              }
            </p>
          </div>

          {/* Security Notice */}
          <Card className="mt-8 p-4 bg-muted/20 border-border/40">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Security Notice</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ultron Swap never stores your private keys. All transactions are signed locally in your wallet. We only
                  request permission to view your wallet addresses and token balances.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
