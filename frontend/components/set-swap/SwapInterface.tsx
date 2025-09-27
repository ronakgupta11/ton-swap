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
    refresh: refreshPrices,
    lastUpdated
  } = usePythPrices({ 
    refreshInterval: 30000, // Refresh every 30 seconds
    autoStart: true
  })

  // Calculate exchange rate based on selected tokens
  const getExchangeRate = () => {
    // Ensure we have valid price data
    if (!ethUsd || !tonUsd || ethUsd <= 0 || tonUsd <= 0) {
      // Return fallback rates if no valid price data
      if (fromToken === "eth" && toToken === "ton") return 565
      if (fromToken === "ton" && toToken === "eth") return 0.0018
      return 1
    }

    // Calculate rates using live price data
    // TON/ETH = (TON/USD) / (ETH/USD)
    if (fromToken === "eth" && toToken === "ton") {
      return ethUsd / tonUsd // How many TON per 1 ETH
    } else if (fromToken === "ton" && toToken === "eth") {
      return tonUsd / ethUsd // How many ETH per 1 TON
    }
    
    return 1 // Default 1:1 for same tokens or unsupported pairs
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    onFromAmountChange?.(value)
    
    // Calculate using live prices
    if (value && !isNaN(Number(value)) && Number(value) > 0) {
      const rate = getExchangeRate()
      if (rate > 0) {
        const calculatedAmount = (Number(value) * rate).toFixed(6)
        setToAmount(`~${calculatedAmount}`)
      } else {
        setToAmount("~0.00")
      }
    } else if (value === "" || value === "0") {
      setToAmount("~0.00")
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
                <span className="text-xs text-muted-foreground ml-2">
                  Using fallback rates
                </span>
              </div>
            ) : priceLoading ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading prices...</span>
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
                {ethUsd > 0 && tonUsd > 0 && (
                  <span className="font-medium text-green-600">
                    1 ETH = {(ethUsd / tonUsd).toFixed(4)} TON
                  </span>
                )}
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                    Updated {lastUpdated.toLocaleTimeString()}
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
            title="Refresh prices"
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
                <SelectItem value="ton">
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
            <span>{fromToken === 'eth' ? 'Ethereum Network' : 'TON Network'}</span>
            <span>Balance: {fromToken === 'eth' ? '2.45 ETH' : '125.50 TON'}</span>
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
                <SelectItem value="eth">
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
              onChange={(e)=>setToAmount(e.target.value)}
              readOnly
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{toToken === 'eth' ? 'Ethereum Network' : 'TON Network'}</span>
            <span>Balance: {toToken === 'eth' ? '2.45 ETH' : '125.50 TON'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
