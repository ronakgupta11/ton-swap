"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { usePythPrices } from "@/hooks/usePythPrices"
import { useWalletBalances } from "@/hooks/useWalletBalances"
import { useTonToEvmOrder } from "@/hooks/useTonToEvmOrder"
import { useAccount } from "wagmi"
import { useTonAddress, useTonWallet } from "@tonconnect/ui-react"
import { handleEvmToTonOrder } from "@/lib/handle-swap"
import { toast } from "sonner"

interface SwapInterfaceProps {
  onSwapDirectionChange?: () => void
  onFromAmountChange?: (amount: string) => void
  onFromTokenChange?: (token: string) => void
  onToTokenChange?: (token: string) => void
  onCreateOrder?: (result: any) => void
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
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  // Wallet connections
  const { address: evmAddress, isConnected: evmConnected } = useAccount()
  const tonWallet = useTonWallet()
  const tonConnected = !!tonWallet
  const tonAddress = useTonAddress()

  // Order creation hooks
  const { createOrder: createTonToEvmOrder, isLoading: tonOrderLoading, error: tonOrderError } = useTonToEvmOrder()

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

  // Order creation handler
  const handleCreateOrder = useCallback(async () => {
    if (isCreatingOrder) return

    // Validate inputs
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!toAmount || toAmount === "~0.0") {
      toast.error("Please wait for price calculation")
      return
    }

    setIsCreatingOrder(true)

    try {
      let result

      if (fromToken === "TON" && toToken === "ETH") {
        // TON to EVM order
        console.log('TON wallet state:', { tonConnected, tonWallet });
        
        if (!tonConnected) {
          toast.error("Please connect your TON wallet")
          return
        }

        if (!tonAddress) {
          toast.error("TON wallet address not available")
          return
        }

        if (!evmAddress) {
          toast.error("Please provide an EVM address for receiving ETH")
          return
        }

        result = await createTonToEvmOrder({
          makerSrcAddress: tonAddress,
          fromAmount,
          toAmount: toAmount.replace("~", ""),
          makerDstAddress: evmAddress,
          toToken: "0x0000000000000000000000000000000000000000", // ETH address
          expiresInMinutes: duration
        })

        toast.success("TON to EVM order created successfully!")
      } else if (fromToken === "ETH" && toToken === "TON") {
        // EVM to TON order
        if (!evmConnected) {
          toast.error("Please connect your EVM wallet")
          return
        }

        if (!tonAddress) {
          toast.error("Please provide a TON address for receiving TON")
          return
        }

        // Generate hashlock and salt for EVM order
        const hashlock = "0x" + Math.random().toString(16).substring(2, 66).padStart(64, '0')
        const salt = Math.floor(Math.random() * 2**32)
        const expiresAt = new Date(Date.now() + duration * 60 * 1000)

        result = await handleEvmToTonOrder({
          makerSrcAddress: evmAddress!,
          fromToken: "0x0000000000000000000000000000000000000000", // ETH
          toToken: "0x0000000000000000000000000000000000000000",
          fromAmount,
          toAmount: toAmount.replace("~", ""),
          makerDstAddress: tonAddress,
          hashlock,
          salt,
          expiresAt
        })

        toast.success("EVM to TON order created successfully!")
      } else {
        toast.error("Unsupported token pair")
        return
      }

      // Call the parent callback with the result
      onCreateOrder?.(result)
    } catch (error) {
      console.error("Order creation failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create order")
    } finally {
      setIsCreatingOrder(false)
    }
  }, [
    isCreatingOrder,
    fromAmount,
    toAmount,
    fromToken,
    toToken,
    duration,
    tonConnected,
    evmConnected,
    evmAddress,
    tonAddress,
    createTonToEvmOrder,
    onCreateOrder
  ])

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
        <div className="mt-6 z-100">
          <Button
            size="lg"
            className="w-full bg-white z-100 gradient-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
            onClick={handleCreateOrder}
            disabled={isCreatingOrder || tonOrderLoading}
          >
            {isCreatingOrder || tonOrderLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                Create Order
                <ArrowUpDown className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          {/* Wallet connection status */}
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {fromToken === "TON" && toToken === "ETH" && (
              <div>
                {tonConnected ? (
                  <span className="text-green-600">✓ TON wallet connected</span>
                ) : (
                  <span className="text-red-600">⚠ Connect TON wallet to create order</span>
                )}
              </div>
            )}
            {fromToken === "ETH" && toToken === "TON" && (
              <div>
                {evmConnected ? (
                  <span className="text-green-600">✓ EVM wallet connected</span>
                ) : (
                  <span className="text-red-600">⚠ Connect EVM wallet to create order</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}