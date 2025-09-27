"use client"

import { Card } from "@/components/ui/card"

interface ExecutionSummaryProps {
  fromAmount?: string
  toAmount?: string
  duration?: number
  slices?: number
  fromToken?: string
  toToken?: string
}

export function ExecutionSummary({ 
  fromAmount = "1.5",
  toAmount = "~847.5",
  duration = 30,
  slices = 6,
  fromToken = "ETH",
  toToken = "TON"
}: ExecutionSummaryProps) {
  const sliceAmount = fromAmount ? (Number(fromAmount) / slices).toFixed(2) : "0.00"

  return (
    <Card className="p-4">
      <h4 className="text-sm font-medium mb-3">Execution Summary</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Amount:</span>
          <span>{fromAmount} {fromToken}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Expected Output:</span>
          <span>{toAmount} {toToken}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration:</span>
          <span>{duration} minutes</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Slices:</span>
          <span>{slices} × {sliceAmount} {fromToken}</span>
        </div>
      </div>
    </Card>
  )
}
