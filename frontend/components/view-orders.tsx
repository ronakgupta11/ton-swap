"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  fromToken: string;
  toToken: string;
  amount: string;
  expectedOutput: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string;
  slices: number;
  duration: string;
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    fromToken: "ETH",
    toToken: "TON",
    amount: "1.5 ETH",
    expectedOutput: "~847.5 TON",
    status: "completed",
    createdAt: "2024-01-15 10:30:00",
    completedAt: "2024-01-15 11:00:00",
    slices: 6,
    duration: "30 minutes"
  },
  {
    id: "ORD-002",
    fromToken: "USDC",
    toToken: "TON",
    amount: "1000 USDC",
    expectedOutput: "~565.2 TON",
    status: "pending",
    createdAt: "2024-01-15 14:15:00",
    slices: 4,
    duration: "20 minutes"
  },
  {
    id: "ORD-003",
    fromToken: "ETH",
    toToken: "USDT",
    amount: "0.8 ETH",
    expectedOutput: "~1850 USDT",
    status: "cancelled",
    createdAt: "2024-01-15 09:45:00",
    slices: 3,
    duration: "15 minutes"
  }
];

const getStatusIcon = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "cancelled":
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const getStatusBadge = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
    case "completed":
      return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
  }
};

export function ViewOrders() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Orders</h2>
        <p className="text-muted-foreground">
          Track and manage your swap orders
        </p>
      </div>

      {mockOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first swap order to get started
          </p>
          <Button>Create Order</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="font-semibold">Order {order.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {order.fromToken} → {order.toToken}
                    </p>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{order.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Output</p>
                  <p className="font-medium">{order.expectedOutput}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slices</p>
                  <p className="font-medium">{order.slices}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{order.duration}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p>Created: {order.createdAt}</p>
                  {order.completedAt && (
                    <p>Completed: {order.completedAt}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/order/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </Link>
                  {order.status === "pending" && (
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
