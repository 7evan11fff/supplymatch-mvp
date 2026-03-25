"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, ArrowRight } from "lucide-react";
import { MessageThread } from "@/components/ui/message-thread";

interface Order {
  id: string;
  status: string;
  subtotal: number;
  platformFee: number;
  total: number;
  createdAt: string;
  business: { name: string };
  lineItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string | null;
    unitPrice: number;
    lineTotal: number;
  }>;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

const TAB_ALL = "ALL";

const NEXT_STATUS: Record<string, string> = {
  PAID: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Mark as Processing",
  PROCESSING: "Mark as Shipped",
  SHIPPED: "Mark as Delivered",
};

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" {
  if (status === "PENDING_PAYMENT") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "default";
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_ALL);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch("/api/supplier/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (tab === TAB_ALL) return orders;
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    setUpdatingId(order.id);
    try {
      const res = await fetch("/api/supplier/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status: next }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Update failed");
        return;
      }

      toast.success(`Order marked as ${next.replace(/_/g, " ").toLowerCase()}`);
      fetchOrders();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">
          View and manage orders from your customers.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value={TAB_ALL}>All</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
          <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
          <TabsTrigger value="SHIPPED">Shipped</TabsTrigger>
          <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading orders...
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-60" />
                <p className="font-medium text-foreground">No orders</p>
                <p className="text-sm mt-1">
                  Orders from businesses will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {order.business.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            { dateStyle: "medium" }
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border divide-y">
                      {order.lineItems.map((li) => (
                        <div
                          key={li.id}
                          className="flex flex-wrap justify-between gap-2 p-3 text-sm"
                        >
                          <div>
                            <span className="font-medium">{li.name}</span>
                            <span className="text-muted-foreground ml-2">
                              x{li.quantity}
                              {li.unit ? ` ${li.unit}` : ""}
                            </span>
                          </div>
                          <span className="tabular-nums font-medium">
                            {formatMoney(li.lineTotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-semibold text-base tabular-nums">
                          {formatMoney(order.total)}
                        </span>
                      </div>

                      {NEXT_STATUS[order.status] && (
                        <Button
                          size="sm"
                          onClick={() => advanceStatus(order)}
                          disabled={updatingId === order.id}
                        >
                          {updatingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-2" />
                          )}
                          {STATUS_LABELS[order.status]}
                        </Button>
                      )}
                    </div>

                    <Separator />
                    <MessageThread orderId={order.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
