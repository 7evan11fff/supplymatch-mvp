"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
  ChevronDown,
  ChevronRight,
  Package,
  Truck,
  CircleCheck,
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  subtotal: number;
  platformFee: number;
  total: number;
  cycleNumber: number | null;
  adminNotes: string | null;
  createdAt: string;
  business: { name: string; industry: string };
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

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_PAYMENT: "outline",
  PAID: "secondary",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("PAID");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
        else toast.error("Failed to load orders");
      })
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const paidCount = orders.filter((o) => o.status === "PAID").length;

  const filtered =
    tab === "ALL" ? orders : orders.filter((o) => o.status === tab);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Order marked ${status.replace(/_/g, " ").toLowerCase()}`);
      fetchOrders();
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Track payments and fulfillment across suppliers.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 py-1">
          <TabsTrigger value="PAID">
            Paid (needs action) ({paidCount})
          </TabsTrigger>
          <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
          <TabsTrigger value="SHIPPED">Shipped</TabsTrigger>
          <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No orders in this category.
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => {
                const open = expandedId === order.id;
                return (
                  <Card key={order.id}>
                    <CardHeader className="pb-3">
                      <button
                        type="button"
                        className="w-full text-left rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="mt-0.5 text-muted-foreground shrink-0">
                              {open ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <CardTitle className="text-lg">
                                {order.business.name} → {order.supplier.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {formatDate(order.createdAt)} ·{" "}
                                {order.lineItems.length} line item
                                {order.lineItems.length === 1 ? "" : "s"} ·{" "}
                                {formatMoney(order.total)}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {order.cycleNumber != null ? (
                              <Badge variant="outline">
                                Cycle {order.cycleNumber}
                              </Badge>
                            ) : null}
                            <Badge variant={statusBadge[order.status] ?? "secondary"}>
                              {order.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div
                        className="flex flex-wrap gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.status === "PAID" ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              void updateStatus(order.id, "PROCESSING")
                            }
                            disabled={updatingId === order.id}
                          >
                            <Package className="h-3.5 w-3.5 mr-1" />
                            Mark processing
                          </Button>
                        ) : null}
                        {order.status === "PROCESSING" ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              void updateStatus(order.id, "SHIPPED")
                            }
                            disabled={updatingId === order.id}
                          >
                            <Truck className="h-3.5 w-3.5 mr-1" />
                            Mark shipped
                          </Button>
                        ) : null}
                        {order.status === "SHIPPED" ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              void updateStatus(order.id, "DELIVERED")
                            }
                            disabled={updatingId === order.id}
                          >
                            <CircleCheck className="h-3.5 w-3.5 mr-1" />
                            Mark delivered
                          </Button>
                        ) : null}
                      </div>
                      {open ? (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Line items
                            </p>
                            <ul className="divide-y rounded-md border">
                              {order.lineItems.map((li) => (
                                <li
                                  key={li.id}
                                  className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm"
                                >
                                  <span>
                                    {li.name}
                                    <span className="text-muted-foreground">
                                      {" "}
                                      × {li.quantity}
                                      {li.unit ? ` ${li.unit}` : ""}
                                    </span>
                                  </span>
                                  <span className="tabular-nums">
                                    {formatMoney(li.lineTotal)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex flex-wrap justify-between gap-2 text-sm pt-1">
                              <span className="text-muted-foreground">
                                Subtotal
                              </span>
                              <span>{formatMoney(order.subtotal)}</span>
                            </div>
                            <div className="flex flex-wrap justify-between gap-2 text-sm">
                              <span className="text-muted-foreground">
                                Platform fee
                              </span>
                              <span>{formatMoney(order.platformFee)}</span>
                            </div>
                            <div className="flex flex-wrap justify-between gap-2 text-sm font-medium">
                              <span>Total</span>
                              <span>{formatMoney(order.total)}</span>
                            </div>
                            {order.adminNotes ? (
                              <div className="rounded-md bg-muted p-3 mt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Admin notes
                                </p>
                                <p className="text-sm whitespace-pre-wrap">
                                  {order.adminNotes}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
