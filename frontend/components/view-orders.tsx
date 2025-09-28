"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Eye, Trash2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  makerSrcAddress: string;
  makerDstAddress: string;
  resolverAddress?: string;
  status: "pending" | "depositing" | "withdrawing" | "completed" | "failed" | "expired" | "cancelled";
  hashlock: string;
  salt: number;
  orderHash: string;
  signature: string;
  escrowSrcAddress?: string;
  escrowDstAddress?: string;
  srcEscrowTxHash?: string;
  dstEscrowTxHash?: string;
  srcWithdrawTxHash?: string;
  dstWithdrawTxHash?: string;
  secret?: string;
  relayerFee?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const getStatusIcon = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "depositing":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "withdrawing":
      return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />;
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "expired":
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case "cancelled":
      return <XCircle className="w-4 h-4 text-gray-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
    case "depositing":
      return <Badge className="bg-blue-500/20 text-blue-400">Depositing</Badge>;
    case "withdrawing":
      return <Badge className="bg-purple-500/20 text-purple-400">Withdrawing</Badge>;
    case "completed":
      return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
    case "failed":
      return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
    case "expired":
      return <Badge className="bg-orange-500/20 text-orange-400">Expired</Badge>;
    case "cancelled":
      return <Badge className="bg-gray-500/20 text-gray-400">Cancelled</Badge>;
    default:
      return <Badge className="bg-gray-500/20 text-gray-400">Unknown</Badge>;
  }
};

export function ViewOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  const fetchOrders = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/orders?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      
      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCount: data.totalCount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: string, token: string) => {
    return `${amount} ${token}`;
  };

  const canCancelOrder = (status: Order["status"]) => {
    return status === "pending" || status === "depositing";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Your Orders</h2>
          <p className="text-muted-foreground">
            Track and manage your swap orders
          </p>
        </div>
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Loading orders...</h3>
          <p className="text-muted-foreground">
            Please wait while we fetch your orders
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Your Orders</h2>
          <p className="text-muted-foreground">
            Track and manage your swap orders
          </p>
        </div>
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Error loading orders</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchOrders()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Orders</h2>
        <p className="text-muted-foreground">
          Track and manage your swap orders ({pagination.totalCount} total)
        </p>
      </div>

      {orders.length === 0 ? (
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
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="font-semibold">Order {order.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-muted-foreground">
                      {order.fromChain} {order.fromToken} → {order.toChain} {order.toToken}
                    </p>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">From Amount</p>
                  <p className="font-medium">{formatAmount(order.fromAmount, order.fromToken)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To Amount</p>
                  <p className="font-medium">{formatAmount(order.toAmount, order.toToken)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">{formatDate(order.expiresAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relayer Fee</p>
                  <p className="font-medium">{order.relayerFee || 'N/A'}</p>
                </div>
              </div>

              {(order.escrowSrcAddress || order.escrowDstAddress) && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Escrow Addresses</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {order.escrowSrcAddress && (
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <p className="font-mono break-all">{order.escrowSrcAddress}</p>
                      </div>
                    )}
                    {order.escrowDstAddress && (
                      <div>
                        <span className="text-muted-foreground">Destination:</span>
                        <p className="font-mono break-all">{order.escrowDstAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p>Created: {formatDate(order.createdAt)}</p>
                  <p>Updated: {formatDate(order.updatedAt)}</p>
                  {order.resolverAddress && (
                    <p>Resolver: {order.resolverAddress.slice(0, 10)}...</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/order/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </Link>
                  {canCancelOrder(order.status) && (
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

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

