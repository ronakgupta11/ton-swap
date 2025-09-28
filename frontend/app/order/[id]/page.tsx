"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { OrderDetails } from "@/components/order-details";
import { ProgressTracker } from "@/components/progress-tracker";

// Mock data - in a real app, this would come from an API
const mockOrderData = {
  "ORD-001": {
    id: "ORD-001",
    fromToken: "ETH",
    toToken: "TON",
    amount: "1.5 ETH",
    expectedOutput: "~847.5 TON",
    status: "in_progress" as const,
    createdAt: "2024-01-15 10:30:00",
    completedAt: undefined,
    slices: 6,
    duration: "30 minutes",
    fromNetwork: "Ethereum",
    toNetwork: "TON",
    slippage: "0.5%",
    fees: "$12.50",
    priceImpact: "-0.08%",
    sourceEscrowAddress: "0x1234567890abcdef1234567890abcdef12345678",
    destinationEscrowAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
    secretHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    makerAddress: "0x9876543210fedcba9876543210fedcba98765432",
    resolverAddress: "0x1111111111111111111111111111111111111111"
  },
  "ORD-002": {
    id: "ORD-002",
    fromToken: "USDC",
    toToken: "TON",
    amount: "1000 USDC",
    expectedOutput: "~565.2 TON",
    status: "pending" as const,
    createdAt: "2024-01-15 14:15:00",
    completedAt: undefined,
    slices: 4,
    duration: "20 minutes",
    fromNetwork: "Ethereum",
    toNetwork: "TON",
    slippage: "0.3%",
    fees: "$8.50",
    priceImpact: "-0.05%",
    sourceEscrowAddress: "0x2345678901bcdef1234567890abcdef123456789",
    destinationEscrowAddress: "EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t",
    secretHash: "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    makerAddress: "0x8765432109edcba9876543210fedcba987654321",
    resolverAddress: "0x2222222222222222222222222222222222222222"
  },
  "ORD-003": {
    id: "ORD-003",
    fromToken: "ETH",
    toToken: "USDT",
    amount: "0.8 ETH",
    expectedOutput: "~1850 USDT",
    status: "completed" as const,
    createdAt: "2024-01-15 09:45:00",
    completedAt: "2024-01-15 10:15:00",
    slices: 3,
    duration: "15 minutes",
    fromNetwork: "Ethereum",
    toNetwork: "Ethereum",
    slippage: "0.2%",
    fees: "$6.20",
    priceImpact: "-0.03%",
    sourceEscrowAddress: "0x3456789012cdef1234567890abcdef123456789a",
    destinationEscrowAddress: "0x4567890123def1234567890abcdef123456789ab",
    secretHash: "0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    makerAddress: "0x7654321098dcba9876543210fedcba9876543210",
    resolverAddress: "0x3333333333333333333333333333333333333333"
  }
};

// Progress steps based on the image
const getProgressSteps = (orderStatus: string) => {
  const baseSteps = [
    { id: 1, title: "Order Created", status: "completed" as const },
    { id: 2, title: "Order Accepted", status: "completed" as const },
    { id: 3, title: "Source Escrow Deployed", subtitle: "verify on chain", status: "completed" as const },
    { id: 4, title: "Destination Escrow Deployed", subtitle: "verify on chain", status: "completed" as const },
    { id: 5, title: "Secret Shared", status: "completed" as const },
    { id: 6, title: "Withdraw for Maker", subtitle: "verify on chain", status: "completed" as const },
    { id: 7, title: "Withdraw for Resolver", status: "current" as const },
    { id: 8, title: "Order Completed", status: "pending" as const }
  ];

  // Adjust based on actual order status
  if (orderStatus === "pending") {
    return baseSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? "current" as const : "pending" as const
    }));
  } else if (orderStatus === "completed") {
    return baseSteps.map(step => ({
      ...step,
      status: "completed" as const
    }));
  }

  return baseSteps;
};

export default function OrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState(mockOrderData[orderId as keyof typeof mockOrderData]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real app, fetch order data based on orderId
    const orderData = mockOrderData[orderId as keyof typeof mockOrderData];
    if (orderData) {
      setOrder(orderData);
    }
  }, [orderId]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleCancel = () => {
    // Handle order cancellation
    console.log("Cancel order:", orderId);
  };

  const handleCompleteStep = (stepId: number) => {
    // Handle step completion
    console.log("Complete step:", stepId);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The order with ID "{orderId}" could not be found.
          </p>
          <Link href="/set-swap">
            <Button>Back to Orders</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const progressSteps = getProgressSteps(order.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/set-swap" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground hover:text-foreground transition-colors">Back to Orders</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Ultron Swap</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <p className="text-muted-foreground">
              Track your swap order progress and details
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <OrderDetails
                order={order}
                onRefresh={handleRefresh}
                onCancel={handleCancel}
              />
            </div>

            {/* Progress Tracker - Takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <ProgressTracker
                steps={progressSteps}
                onCompleteStep={handleCompleteStep}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
