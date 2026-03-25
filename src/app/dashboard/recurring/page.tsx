"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarClock,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";

interface RecurringOrder {
  id: string;
  status: string;
  frequency: string;
  nextOrderDate: string;
  subtotal: number;
  platformFee: number;
  total: number;
  skipNext: boolean;
  itemsSnapshot: Array<{
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  supplier: { name: string };
  orders: Array<{
    id: string;
    status: string;
    createdAt: string;
    total: number;
  }>;
}

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function parseItems(
  snapshot: unknown
): RecurringOrder["itemsSnapshot"] {
  if (!Array.isArray(snapshot)) return [];
  return snapshot.filter(
    (row): row is RecurringOrder["itemsSnapshot"][number] =>
      row !== null &&
      typeof row === "object" &&
      typeof (row as { name?: unknown }).name === "string" &&
      typeof (row as { quantity?: unknown }).quantity === "number" &&
      typeof (row as { unitPrice?: unknown }).unitPrice === "number" &&
      typeof (row as { lineTotal?: unknown }).lineTotal === "number"
  );
}

export default function RecurringOrdersPage() {
  const [list, setList] = useState<RecurringOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const fetchRecurring = useCallback(() => {
    setLoading(true);
    fetch("/api/recurring")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setList(data as RecurringOrder[]);
        else setList([]);
      })
      .catch(() => {
        toast.error("Failed to load recurring orders");
        setList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (q && !r.supplier.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, filter, search]);

  async function putAction(id: string, action: "pause" | "resume" | "skip") {
    setActingId(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Update failed");
        return;
      }
      toast.success(
        action === "pause"
          ? "Paused"
          : action === "resume"
            ? "Resumed"
            : "Next cycle skipped"
      );
      fetchRecurring();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  async function cancelRecurring(id: string) {
    setActingId(id);
    setCancelTarget(null);
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Cancel failed");
        return;
      }
      toast.success("Cancelled");
      fetchRecurring();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recurring orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage scheduled replenishment from your suppliers.
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="flex-1 min-w-[4.5rem]">
            All
          </TabsTrigger>
          <TabsTrigger value="ACTIVE" className="flex-1 min-w-[4.5rem]">
            Active
          </TabsTrigger>
          <TabsTrigger value="PAUSED" className="flex-1 min-w-[4.5rem]">
            Paused
          </TabsTrigger>
          <TabsTrigger value="CANCELLED" className="flex-1 min-w-[4.5rem]">
            Cancelled
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-4">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="recurring-search">Search suppliers</Label>
          <Input
            id="recurring-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by supplier name"
          />
        </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center text-muted-foreground">
                <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-60" />
                <p className="font-medium text-foreground">No recurring orders</p>
                <p className="text-sm mt-1">
                  {list.length === 0
                    ? "Accept a priced quote as recurring to see it here."
                    : "Nothing matches this filter or search."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((r) => {
                const items = parseItems(r.itemsSnapshot as unknown);
                const busy = actingId === r.id;
                return (
                  <Card key={r.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            {r.supplier.name}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {FREQUENCY_LABELS[r.frequency] ?? r.frequency}
                            </Badge>
                            <Badge
                              variant={
                                r.status === "ACTIVE"
                                  ? "default"
                                  : r.status === "PAUSED"
                                    ? "secondary"
                                    : r.status === "CANCELLED"
                                      ? "destructive"
                                      : "secondary"
                              }
                            >
                              {r.status === "CANCELLED"
                                ? "Cancelled"
                                : r.status.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Next:{" "}
                              {new Date(r.nextOrderDate).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-semibold tabular-nums">
                            {formatMoney(r.total)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {r.skipNext && (
                        <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
                          Next cycle will be skipped
                        </p>
                      )}

                      <div>
                        <p className="text-sm font-medium mb-2">Line items</p>
                        <div className="rounded-md border divide-y">
                          {items.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">
                              No line items recorded.
                            </p>
                          ) : (
                            items.map((row, idx) => (
                              <div
                                key={`${r.id}-item-${idx}`}
                                className="flex flex-wrap justify-between gap-2 p-3 text-sm"
                              >
                                <div>
                                  <span className="font-medium">{row.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ×{row.quantity}
                                    {row.unit ? ` ${row.unit}` : ""}
                                  </span>
                                </div>
                                <div className="tabular-nums text-muted-foreground">
                                  {formatMoney(row.unitPrice)} each ·{" "}
                                  <span className="text-foreground font-medium">
                                    {formatMoney(row.lineTotal)}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium mb-2">
                          Recent orders
                        </p>
                        {(r.orders ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No orders yet for this schedule.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {(r.orders ?? []).slice(0, 3).map((o) => (
                              <li
                                key={o.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm border rounded-md px-3 py-2"
                              >
                                <Link
                                  href={`/dashboard/orders/${o.id}`}
                                  className="font-medium text-primary hover:underline"
                                >
                                  Order
                                </Link>
                                <span className="text-muted-foreground">
                                  {new Date(o.createdAt).toLocaleDateString()}
                                </span>
                                <Badge variant="secondary">{o.status}</Badge>
                                <span className="tabular-nums">
                                  {formatMoney(o.total)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {(r.status === "ACTIVE" || r.status === "PAUSED") && (
                        <>
                          <Separator />
                          <div className="flex flex-wrap gap-2">
                            {r.status === "ACTIVE" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => putAction(r.id, "pause")}
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Pause className="h-4 w-4" />
                                  )}
                                  Pause
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => putAction(r.id, "skip")}
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-4 w-4" />
                                  )}
                                  Skip next
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => setCancelTarget(r.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {r.status === "PAUSED" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => putAction(r.id, "resume")}
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                  Resume
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => setCancelTarget(r.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
      </div>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Recurring Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this recurring order? No future orders will be created. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep Active
            </Button>
            <Button variant="destructive" onClick={() => cancelTarget && cancelRecurring(cancelTarget)}>
              Cancel Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
