"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { CheckCircle, Clock, Zap } from "lucide-react"

interface OrderSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fromAmount: string
  toAmount: string
  fromToken: string
  toToken: string
  duration: number
  slices: number
  slippage: number
  orderResult?: any
}

export function OrderSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  duration,
  slices,
  slippage,
  orderResult
}: OrderSummaryModalProps) {
  const sliceAmount = fromAmount ? (Number(fromAmount) / slices).toFixed(2) : "0.00"
  const sliceInterval = duration / slices

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Order Summary
          </DialogTitle>
          <DialogDescription>
            Review your swap order details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Swap Details */}
          <Card className="p-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {fromAmount} {fromToken}
              </div>
              <div className="text-muted-foreground">↓</div>
              <div className="text-2xl font-bold text-green-600">
                {toAmount} {toToken}
              </div>
            </div>
          </Card>

          {/* Execution Strategy */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Execution Strategy
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span>TWAP (Time-Weighted Average Price)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slices:</span>
                <span>{slices} × {sliceAmount} {fromToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interval:</span>
                <span>Every {sliceInterval.toFixed(1)} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{duration} minutes</span>
              </div>
            </div>
          </Card>

          {/* Risk Settings */}
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Risk Settings
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage Tolerance:</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Price Impact:</span>
                <span>~0.1%</span>
              </div>
            </div>
          </Card>

          {/* Order Details */}
          {orderResult && (
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Order Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono text-xs">{orderResult.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Hash:</span>
                  <span className="font-mono text-xs">{orderResult.orderHash?.slice(0, 10)}...</span>
                </div>
                {orderResult.txHash && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction:</span>
                    <span className="font-mono text-xs">{orderResult.txHash?.slice(0, 10)}...</span>
                  </div>
                )}
                {orderResult.makerPublicKey && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Public Key:</span>
                    <span className="font-mono text-xs">{orderResult.makerPublicKey?.slice(0, 10)}...</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
