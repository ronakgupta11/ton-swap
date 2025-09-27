"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, ExternalLink, Copy, RefreshCw } from "lucide-react";

interface OrderDetails {
  id: string;
  fromToken: string;
  toToken: string;
  amount: string;
  expectedOutput: string;
  status: "pending" | "completed" | "cancelled" | "in_progress";
  createdAt: string;
  completedAt?: string;
  slices: number;
  duration: string;
  fromNetwork: string;
  toNetwork: string;
  slippage: string;
  fees: string;
  priceImpact: string;
  sourceEscrowAddress?: string;
  destinationEscrowAddress?: string;
  secretHash?: string;
  makerAddress?: string;
  resolverAddress?: string;
}

interface OrderDetailsProps {
  order: OrderDetails;
  onRefresh?: () => void;
  onCancel?: () => void;
}

export function OrderDetails({ order, onRefresh, onCancel }: OrderDetailsProps) {
  const getStatusIcon = (status: OrderDetails["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "in_progress":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: OrderDetails["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-400">In Progress</Badge>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(order.status)}
            <div>
              <h2 className="text-xl font-semibold">Order {order.id}</h2>
              <p className="text-sm text-muted-foreground">
                {order.fromToken} → {order.toToken}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            {order.status === "pending" && (
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={onCancel}>
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-lg font-semibold">{order.amount}</p>
            <p className="text-xs text-muted-foreground">{order.fromNetwork}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Expected Output</p>
            <p className="text-lg font-semibold">{order.expectedOutput}</p>
            <p className="text-xs text-muted-foreground">{order.toNetwork}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Execution Details</p>
            <p className="text-sm">{order.slices} slices over {order.duration}</p>
            <p className="text-xs text-muted-foreground">TWAP Strategy</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Created:</span> {order.createdAt}
          </div>
          {order.completedAt && (
            <div>
              <span className="font-medium">Completed:</span> {order.completedAt}
            </div>
          )}
        </div>
      </Card>

      {/* Order Parameters */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Order Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Max Slippage</span>
              <span className="text-sm font-medium">{order.slippage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Estimated Fees</span>
              <span className="text-sm font-medium">{order.fees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Price Impact</span>
              <span className="text-sm font-medium">{order.priceImpact}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Number of Slices</span>
              <span className="text-sm font-medium">{order.slices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="text-sm font-medium">{order.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Strategy</span>
              <span className="text-sm font-medium">TWAP</span>
            </div>
          </div>
        </div>
      </Card>


      {/* Secret Information */}
      {order.secretHash && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Secret Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Secret Hash</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {order.secretHash.slice(0, 12)}...{order.secretHash.slice(-12)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(order.secretHash!)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Participants */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Participants</h3>
        <div className="space-y-3">
          {order.makerAddress && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Maker</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {order.makerAddress.slice(0, 8)}...{order.makerAddress.slice(-8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(order.makerAddress!)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          {order.resolverAddress && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Resolver</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {order.resolverAddress.slice(0, 8)}...{order.resolverAddress.slice(-8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(order.resolverAddress!)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
