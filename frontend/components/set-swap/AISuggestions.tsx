"use client"

import { Card } from "@/components/ui/card"
import { Zap, TrendingUp, Clock, Info } from "lucide-react"

interface AISuggestionsProps {
  slippage?: number
  duration?: number
  slices?: number
}

export function AISuggestions({ 
  slippage = 0.5, 
  duration = 30, 
  slices = 6 
}: AISuggestionsProps) {
  // Calculate expected values based on current settings
  const expectedSlippage = (slippage * 0.24).toFixed(2) // Simulate AI calculation
  const estimatedFees = (slices * 2.08).toFixed(2) // Simulate fee calculation
  const priceImpact = -(slippage * 0.16).toFixed(2) // Simulate price impact

  return (
    <Card className="p-6 animated-border">
      <div className="flex items-center space-x-2 mb-6">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Suggestions</h3>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Optimal Strategy</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Based on current market conditions, we recommend {slices} slices over {duration} minutes for minimal slippage.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Expected Slippage:</span>
              <span className="text-primary">{expectedSlippage}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Estimated Fees:</span>
              <span>${estimatedFees}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Price Impact:</span>
              <span className="text-primary">{priceImpact}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Market Analysis</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            ETH/TON pair showing low volatility. Good time for TWAP execution.
          </p>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-green-400">Low volatility detected</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Network Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Ethereum Gas:</span>
              <span className="text-yellow-400">Medium (25 gwei)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>TON Network:</span>
              <span className="text-green-400">Fast</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
