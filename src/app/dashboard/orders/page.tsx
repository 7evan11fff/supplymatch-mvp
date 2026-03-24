"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { CreditCard, Loader2, Plus } from "lucide-react";

interface Order {
  id: string;
  status: string;
  subtotal: number;
  platformFee: number;
  total: number;
  cycleNumber: number | null;
  recurringOrderId?: string | null;
  createdAt: string;
  supplier: { name: string };
  lineItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string | null;
    unitPrice: number;
    lineTotal: number;
  }>;
}

const TAB_ALL = "ALL";

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" {
  if (status === "PENDING_PAYMENT") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "default";
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function lineItemsSummary(items: Order["lineItems"]) {
  if (items.length === 0) return "No line items";
  const parts = items.slice(0, 3).map((li) => {
    const u = li.unit ? ` ${li.unit}` : "";
    return `${li.name} ×${li.quantity}${u}`;
  });
  const extra =
    items.length > 3 ? ` +${items.length - 3} more` : "";
  return `${items.length} item${items.length === 1 ? "" : "s"}: ${parts.join(", ")}${extra}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_ALL);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch("/api/orders")
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

  async function handleCheckout(order: Order) {
    const hasRecurring =
      Boolean(order.recurringOrderId) || order.cycleNumber != null;
    setCheckoutId(order.id);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          savePaymentMethod: hasRecurring,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Checkout failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error("No checkout URL returned");
    } catch {
      toast.error("Checkout failed");
    } finally {
      setCheckoutId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track payments and fulfillment for your supplier orders.
          </p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          <Plus className="h-4 w-4 mr-2" />
          Request a quote
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value={TAB_ALL}>All</TabsTrigger>
          <TabsTrigger value="PENDING_PAYMENT">Pending Payment</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
          <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
          <TabsTrigger value="SHIPPED">Shipped</TabsTrigger>
          <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">
              Loading orders...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No orders in this view.
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {order.supplier.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            {
                              dateStyle: "medium",
                            }
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {lineItemsSummary(order.lineItems)}
                    </p>
                    <Separator />
                    <div className="grid gap-1 text-sm sm:grid-cols-3">
                      <div className="flex justify-between sm:block">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(order.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="text-muted-foreground">Platform fee</span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(order.platformFee)}
                        </span>
                      </div>
                      <div className="flex justify-between sm:block">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold tabular-nums">
                          {formatMoney(order.total)}
                        </span>
                      </div>
                    </div>
                    {order.status === "PENDING_PAYMENT" && (
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() => handleCheckout(order)}
                        disabled={checkoutId === order.id}
                      >
                        {checkoutId === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    )}
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
