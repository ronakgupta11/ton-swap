"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, RefreshCw, AlertCircle } from "lucide-react"
import { usePythPrices } from "@/hooks/usePythPrices"

interface SwapInterfaceProps {
  onSwapDirectionChange?: () => void
  onFromAmountChange?: (amount: string) => void
  onFromTokenChange?: (token: string) => void
  onToTokenChange?: (token: string) => void
}

export function SwapInterface({ 
  onSwapDirectionChange,
  onFromAmountChange,
  onFromTokenChange,
  onToTokenChange
}: SwapInterfaceProps) {
  const [fromAmount, setFromAmount] = useState("1.5")
  const [fromToken, setFromToken] = useState("eth")
  const [toToken, setToToken] = useState("ton")
  const [toAmount, setToAmount] = useState("~847.5")

  // Get live price data from Pyth Network
  const { 
    ethUsd, 
    tonUsd, 
    ethTonRatio, 
    isLoading: priceLoading, 
    error: priceError, 
    refresh: refreshPrices 
  } = usePythPrices({ refreshInterval: 30000 }) // Refresh every 30 seconds

  // Calculate exchange rate based on selected tokens
  const getExchangeRate = () => {
    if (fromToken === "eth" && toToken === "ton") {
      return ethTonRatio || 565 // Fallback to demo rate
    } else if (fromToken === "ton" && toToken === "eth") {
      return tonUsd && ethUsd ? ethUsd / tonUsd : 0.0018 // Fallback rate
    } else if (fromToken === "eth" && toToken === "usdc") {
      return ethUsd || 3000 // Fallback rate
    } else if (fromToken === "ton" && toToken === "usdt") {
      return tonUsd || 2.5 // Fallback rate
    }
    return 1 // Default 1:1 for same tokens
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    onFromAmountChange?.(value)
    
    // Calculate using live prices
    if (value && !isNaN(Number(value))) {
      const rate = getExchangeRate()
      const calculatedAmount = (Number(value) * rate).toFixed(2)
      setToAmount(`~${calculatedAmount}`)
    } else {
      setToAmount("~0.00")
    }
  }

  const handleFromTokenChange = (value: string) => {
    setFromToken(value)
    onFromTokenChange?.(value)
    // Recalculate when token changes
    handleFromAmountChange(fromAmount)
  }

  const handleToTokenChange = (value: string) => {
    setToToken(value)
    onToTokenChange?.(value)
    // Recalculate when token changes
    handleFromAmountChange(fromAmount)
  }

  const handleSwapDirection = () => {
    // Swap the tokens and amounts
    const tempToken = fromToken
    const tempAmount = fromAmount
    
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount.replace("~", ""))
    setToAmount(`~${tempAmount}`)
    
    // Recalculate with new token pair
    setTimeout(() => {
      handleFromAmountChange(toAmount.replace("~", ""))
    }, 0)
    
    onSwapDirectionChange?.()
  }

  // Recalculate when prices update
  useEffect(() => {
    if (ethTonRatio > 0 || tonUsd > 0 || ethUsd > 0) {
      handleFromAmountChange(fromAmount)
    }
  }, [ethTonRatio, tonUsd, ethUsd])

  return (
    <Card className="p-6 animated-border relative">
      <div className="space-y-6 relative z-10">
        {/* Price Display and Refresh */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-4 text-sm">
            {priceError ? (
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Price data unavailable</span>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {ethUsd > 0 && (
                  <span className="text-muted-foreground">
                    ETH: ${ethUsd.toFixed(2)}
                  </span>
                )}
                {tonUsd > 0 && (
                  <span className="text-muted-foreground">
                    TON: ${tonUsd.toFixed(2)}
                  </span>
                )}
                {ethTonRatio > 0 && (
                  <span className="font-medium">
                    1 ETH = {ethTonRatio.toFixed(2)} TON
                  </span>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPrices}
            disabled={priceLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${priceLoading ? 'animate-spin' : ''}`} />
          </Button>
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
                <SelectItem value="eth">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span>ETH</span>
                  </div>
                </SelectItem>
                <SelectItem value="usdc">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    <span>USDC</span>
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
            <span>Ethereum Network</span>
            <span>Balance: 2.45 ETH</span>
          </div>
        </div>

        {/* Swap Direction */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full w-10 h-10 p-0 bg-transparent"
            onClick={handleSwapDirection}
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
                <SelectItem value="ton">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                    <span>TON</span>
                  </div>
                </SelectItem>
                <SelectItem value="usdt">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>USDT</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="0.0"
              className="flex-1 text-right text-lg font-medium bg-muted/20"
              value={priceLoading ? "Loading..." : toAmount}
              onChange={(e)=>setToAmount(e.target.value)}
              readOnly
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>TON Network</span>
            <span>Balance: 125.50 TON</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
