"use client"

import { usePythPrices, useEthTonRatio, useTokenPrices } from "@/hooks/usePythPrices"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, AlertCircle } from "lucide-react"

export function PriceDisplay() {
  const { ethUsd, tonUsd, ethTonRatio, isLoading, error, refresh } = usePythPrices({
    refreshInterval: 10000 // Refresh every 10 seconds
  })

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Prices</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error ? (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? "..." : `$${ethUsd.toFixed(2)}`}
              </div>
              <div className="text-sm text-muted-foreground">ETH/USD</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {isLoading ? "..." : `$${tonUsd.toFixed(2)}`}
              </div>
              <div className="text-sm text-muted-foreground">TON/USD</div>
            </div>
            
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? "..." : `${ethTonRatio.toFixed(2)}`}
              </div>
              <div className="text-sm text-muted-foreground">ETH/TON Ratio</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Example of using individual hooks
export function EthTonRatioDisplay() {
  const { ratio, isLoading, error, refresh } = useEthTonRatio()

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">ETH/TON Exchange Rate</div>
          <div className="text-3xl font-bold text-green-600">
            {isLoading ? "Loading..." : `${ratio.toFixed(4)}`}
          </div>
        </div>
        <Button onClick={refresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-destructive">{error}</div>
      )}
    </Card>
  )
}