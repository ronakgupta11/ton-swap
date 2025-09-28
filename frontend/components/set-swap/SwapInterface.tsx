"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, RefreshCw, AlertCircle } from "lucide-react"
import { usePythPrices } from "@/hooks/usePythPrices"
import { useWalletBalances } from "@/hooks/useWalletBalances"

interface SwapInterfaceProps {
  onSwapDirectionChange?: () => void
  onFromAmountChange?: (amount: string) => void
  onFromTokenChange?: (token: string) => void
  onToTokenChange?: (token: string) => void
  onCreateOrder?: () => void
  // Order data props
  fromAmount?: string
  toAmount?: string
  fromToken?: string
  toToken?: string
  duration?: number
  slices?: number
  slippage?: number
}

export function SwapInterface({ 
  onSwapDirectionChange,
  onFromAmountChange,
  onFromTokenChange,
  onToTokenChange,
  onCreateOrder,
  fromAmount = "1.5",
  toAmount = "~847.5",
  fromToken = "ETH",
  toToken = "TON",
  duration = 30,
  slices = 2,
  slippage = 0.5
}: SwapInterfaceProps) {
  const [formattedTime, setFormattedTime] = useState("")

  // Get live price data from Pyth Network
  const { 
    ethUsd, 
    tonUsd, 
    ethTonRatio, 
    isLoading: priceLoading, 
    error: priceError, 
    refresh: refreshPrices,
    lastUpdated
  } = usePythPrices({ 
    refreshInterval: 30000, // Refresh every 30 seconds
    autoStart: true
  })

  // Get real-time wallet balances
  const { 
    ethBalance, 
    tonBalance, 
    isLoading: balanceLoading, 
    error: balanceError,
    refresh: refreshBalances
  } = useWalletBalances({
    refreshInterval: 30000, // Refresh every 30 seconds
    autoStart: true
  })

  // Update formatted time on client side to avoid hydration mismatch
  useEffect(() => {
    if (lastUpdated) {
      setFormattedTime(lastUpdated.toLocaleTimeString())
    }
  }, [lastUpdated])

  // Memoized handlers to prevent unnecessary re-renders
  const handleFromAmountChange = useCallback((amount: string) => {
    onFromAmountChange?.(amount)
  }, [onFromAmountChange])

  const handleFromTokenChange = useCallback((token: string) => {
    onFromTokenChange?.(token)
  }, [onFromTokenChange])

  const handleToTokenChange = useCallback((token: string) => {
    onToTokenChange?.(token)
  }, [onToTokenChange])

  const handleSwapDirection = useCallback(() => {
    onSwapDirectionChange?.()
  }, [onSwapDirectionChange])

  // Calculate exchange rate based on selected tokens
  const getExchangeRate = () => {
    // Ensure we have valid price data
    if (!ethUsd || !tonUsd || ethUsd <= 0 || tonUsd <= 0) {
      // Return fallback rates if no valid price data
      if (fromToken === "ETH" && toToken === "TON") return 565
      if (fromToken === "TON" && toToken === "ETH") return 0.0018
      return 1
    }

    // Calculate rates using live price data
    // TON/ETH = (TON/USD) / (ETH/USD)
    if (fromToken === "ETH" && toToken === "TON") {
      return ethUsd / tonUsd // How many TON per 1 ETH
    } else if (fromToken === "TON" && toToken === "ETH") {
      return tonUsd / ethUsd // How many ETH per 1 TON
    }
    
    return 1 // Default 1:1 for same tokens or unsupported pairs
  }


  return (
    <Card className="p-6">
      <div className="space-y-6">
         {/* Price Display Header */}
         <div className="flex items-center justify-between">
           <div className="space-y-1">
             {priceError ? (
               <div className="flex items-center gap-2 text-red-500">
                 <AlertCircle className="w-4 h-4" />
                 <span className="text-sm">Price data unavailable</span>
               </div>
             ) : balanceError ? (
               <div className="flex items-center gap-2 text-yellow-500">
                 <AlertCircle className="w-4 h-4" />
                 <span className="text-sm">Balance data unavailable</span>
               </div>
             ) : (
               <div className="space-y-1">
                 {ethUsd > 0 && tonUsd > 0 && (
                   <span className="font-medium text-green-600">
                     1 ETH = {(ethUsd / tonUsd).toFixed(4)} TON
                   </span>
                 )}
                 {formattedTime && (
                   <span className="text-xs text-muted-foreground">
                     Updated {formattedTime}
                   </span>
                 )}
               </div>
             )}
           </div>
           <div className="flex gap-1">
             <Button
               variant="ghost"
               size="sm"
               onClick={refreshPrices}
               disabled={priceLoading}
               className="h-8 w-8 p-0"
               title="Refresh prices only"
             >
               <RefreshCw className={`w-4 h-4 ${priceLoading ? 'animate-spin' : ''}`} />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               onClick={refreshBalances}
               disabled={balanceLoading}
               className="h-8 w-8 p-0"
               title="Refresh balances only"
             >
               <RefreshCw className={`w-4 h-4 ${balanceLoading ? 'animate-spin' : ''}`} />
             </Button>
           </div>
         </div>
        
        {/* From Token */}
        <div>
          <Label className="text-sm font-medium mb-3 block">From</Label>
          <div className="flex items-center space-x-4">
            <Select value={fromToken} onValueChange={handleFromTokenChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!z-[99999]">
                <SelectItem value="ETH">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span>ETH</span>
                  </div>
                </SelectItem>
                <SelectItem value="TON">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                    <span>TON</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="0.0" 
              className="flex-1 text-right text-lg font-medium" 
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
            />
          </div>
           <div className="flex justify-between text-sm text-muted-foreground mt-2">
             <span>{fromToken === 'ETH' ? 'Ethereum Network' : 'TON Network'}</span>
             <span>
               Balance: {fromToken === 'ETH' ? (
                 balanceLoading ? 'Loading...' : `${ethBalance} ETH`
               ) : (
                 balanceLoading ? 'Loading...' : `${tonBalance} TON`
               )}
             </span>
           </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapDirection}
            className="rounded-full w-10 h-10 p-0"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div>
          <Label className="text-sm font-medium mb-3 block">To</Label>
          <div className="flex items-center space-x-4">
            <Select value={toToken} onValueChange={handleToTokenChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!z-[99999]">
                <SelectItem value="TON">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                    <span>TON</span>
                  </div>
                </SelectItem>
                <SelectItem value="ETH">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span>ETH</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="0.0"
              className="flex-1 text-right text-lg font-medium bg-muted/20"
              value={priceLoading && !ethUsd && !tonUsd ? "Loading prices..." : toAmount}
              readOnly
            />
          </div>
           <div className="flex justify-between text-sm text-muted-foreground mt-2">
             <span>{toToken === 'ETH' ? 'Ethereum Network' : 'TON Network'}</span>
             <span>
               Balance: {toToken === 'ETH' ? (
                 balanceLoading ? 'Loading...' : `${ethBalance} ETH`
               ) : (
                 balanceLoading ? 'Loading...' : `${tonBalance} TON`
               )}
             </span>
           </div>
        </div>

        {/* Create Order Button */}
        {onCreateOrder && (
          <div className="mt-6 z-100">
            <Button
              variant="outline"
              size="lg"
              className="w-full  z-100 gradient-primary text-white opacity-90 transition-opacity glow-primary"
              onClick={onCreateOrder}
            >
              Create Order
              <ArrowUpDown className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}