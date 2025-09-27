"use client";

import { useState } from "react";
import { SwapTabs } from "@/components/swap-tabs";
import { ViewOrders } from "@/components/view-orders";
import {
  NavigationHeader,
  SwapInterface,
  AdvancedSettings,
  AISuggestions,
  ExecutionSummary,
} from "@/components/set-swap";
import { OrderSummaryModal } from "@/components/set-swap/OrderSummaryModal";

export default function SetSwapPage() {
  // State management for all swap parameters
  const [fromAmount, setFromAmount] = useState("1.5");
  const [toAmount, setToAmount] = useState("~847.5");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("TON");
  const [slippage, setSlippage] = useState(0.5);
  const [duration, setDuration] = useState(30);
  const [slices, setSlices] = useState(6);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const handleFromAmountChange = (amount: string) => {
    setFromAmount(amount);
    // Recalculate to amount based on new from amount
    if (amount && !isNaN(Number(amount))) {
      const calculatedAmount = (Number(amount) * 565).toFixed(1);
      setToAmount(`~${calculatedAmount}`);
    } else {
      setToAmount("~0.0");
    }
  };

  const handleSwapDirectionChange = () => {
    // Swap the tokens and amounts
    const tempToken = fromToken;
    const tempAmount = fromAmount;

    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount.replace("~", ""));
    setToAmount(`~${tempAmount}`);
  };

  const handleCreateOrder = () => {
    setIsOrderModalOpen(true);
  };

  const handleConfirmOrder = () => {
    // TODO: Implement order creation logic
    console.log("Order confirmed:", {
      fromAmount,
      toAmount,
      fromToken,
      toToken,
      duration,
      slices,
      slippage,
    });
    setIsOrderModalOpen(false);
    // You can add success notification here
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Configure Your Swap</h1>
            <p className="text-muted-foreground">
              Set your swap parameters and let AI optimize the execution
              strategy.
            </p>
          </div>

          <SwapTabs
            swapContent={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Swap Configuration */}
                <div className="lg:col-span-2 space-y-6">
                  <SwapInterface
                    onSwapDirectionChange={handleSwapDirectionChange}
                    onFromAmountChange={handleFromAmountChange}
                    onFromTokenChange={setFromToken}
                    onToTokenChange={setToToken}
                    onCreateOrder={handleCreateOrder}
                    fromAmount={fromAmount}
                    toAmount={toAmount}
                    fromToken={fromToken}
                    toToken={toToken}
                    duration={duration}
                    slices={slices}
                    slippage={slippage}
                  />

                  <AdvancedSettings
                    onSlippageChange={setSlippage}
                    onDurationChange={setDuration}
                    onSlicesChange={setSlices}
                  />
                </div>

                {/* AI Suggestions Panel */}
                <div className="space-y-6">
                  <AISuggestions
                    slippage={slippage}
                    duration={duration}
                    slices={slices}
                  />
                </div>
              </div>
            }
            ordersContent={<ViewOrders />}
          />

          {/* Order Summary Modal */}
          <OrderSummaryModal
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
            onConfirm={handleConfirmOrder}
            fromAmount={fromAmount}
            toAmount={toAmount}
            fromToken={fromToken}
            toToken={toToken}
            duration={duration}
            slices={slices}
            slippage={slippage}
          />
        </div>
      </div>
    </div>
  );
}
