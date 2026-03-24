"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CreditCard, Loader2, RefreshCw } from "lucide-react";

interface OrderDetail {
  id: string;
  status: string;
  subtotal: number;
  platformFee: number;
  total: number;
  cycleNumber: number | null;
  recurringOrderId?: string | null;
  createdAt: string;
  supplier: { name: string };
  business: {
    name: string;
    user: { email: string; name: string | null };
  };
  recurringOrder: {
    id: string;
    frequency: string;
    status: string;
    nextOrderDate: string;
  } | null;
  lineItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string | null;
    unitPrice: number;
    lineTotal: number;
  }>;
}

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

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentHandled, setPaymentHandled] = useState(false);

  const fetchOrder = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/orders/${id}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          setOrder(null);
          return;
        }
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setNotFound(false);
        setOrder(data);
      })
      .catch(() => {
        setOrder(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (paymentHandled) return;
    const p = searchParams.get("payment");
    if (p === "success") {
      toast.success("Payment completed successfully.");
      setPaymentHandled(true);
    } else if (p === "cancelled") {
      toast.info("Payment was cancelled.");
      setPaymentHandled(true);
    }
  }, [searchParams, paymentHandled]);

  async function handleCheckout() {
    if (!order) return;
    const hasRecurring =
      Boolean(order.recurringOrder) ||
      Boolean(order.recurringOrderId) ||
      order.cycleNumber != null;
    setCheckoutLoading(true);
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
      setCheckoutLoading(false);
    }
  }

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-muted-foreground">
        Invalid order.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">
        Loading order...
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/dashboard/orders"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 inline-flex items-center")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to orders
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Order not found</CardTitle>
            <CardDescription>
              This order may not exist or you may not have access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard/orders"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 inline-flex items-center")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to orders
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.supplier.name}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {order.business.name} · {order.business.user.email}
            {order.business.user.name
              ? ` · ${order.business.user.name}`
              : ""}
          </p>
        </div>
        <Badge
          className="w-fit"
          variant={statusBadgeVariant(order.status)}
        >
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {order.recurringOrder && (
        <Card className="border-primary/20 bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recurring order
            </CardTitle>
            <CardDescription>
              This purchase is part of a subscription with this supplier.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Frequency:</span>{" "}
              {order.recurringOrder.frequency.replace(/_/g, " ")}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {order.recurringOrder.status}
            </p>
            <p>
              <span className="text-muted-foreground">Next order:</span>{" "}
              {new Date(order.recurringOrder.nextOrderDate).toLocaleDateString(
                undefined,
                { dateStyle: "medium" }
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lineItems.map((li) => (
                <TableRow key={li.id}>
                  <TableCell className="font-medium whitespace-normal">
                    {li.name}
                    {li.unit ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({li.unit})
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {li.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(li.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(li.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-6" />

          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Platform fee (1%)</span>
              <span className="tabular-nums">
                {formatMoney(order.platformFee)}
              </span>
            </div>
            <div className="flex justify-between gap-8 font-semibold text-base pt-2 border-t">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(order.total)}</span>
            </div>
          </div>

          {order.status === "PENDING_PAYMENT" && (
            <Button
              className="mt-6"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
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
    </div>
  );
}
