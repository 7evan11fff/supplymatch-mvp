"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";

interface Quote {
  id: string;
  status: string;
  subtotal: number | null;
  platformFee: number | null;
  total: number | null;
  businessNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  supplier: { name: string };
  lineItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string | null;
    unitPrice: number | null;
    lineTotal: number | null;
  }>;
}

interface OrderRow {
  id: string;
  quoteId: string;
}

type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY";

const FREQ_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
];

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function quoteStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" {
  if (status === "REQUESTED") return "secondary";
  if (status === "EXPIRED") return "destructive";
  return "default";
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orderByQuoteId, setOrderByQuoteId] = useState<Map<string, string>>(
    () => new Map()
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurringQuoteId, setRecurringQuoteId] = useState<string | null>(
    null
  );
  const [frequency, setFrequency] = useState<RecurringFrequency>("WEEKLY");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/quotes").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ])
      .then(([qData, oData]) => {
        if (Array.isArray(qData)) setQuotes(qData as Quote[]);
        else setQuotes([]);
        if (Array.isArray(oData)) {
          const m = new Map<string, string>();
          for (const o of oData as OrderRow[]) {
            if (o.quoteId && o.id && !m.has(o.quoteId)) m.set(o.quoteId, o.id);
          }
          setOrderByQuoteId(m);
        } else {
          setOrderByQuoteId(new Map());
        }
      })
      .catch(() => {
        toast.error("Failed to load quotes");
        setQuotes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (filter !== "all" && quote.status !== filter) return false;
      if (q && !quote.supplier.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [quotes, filter, search]);

  async function checkoutAfterAccept(orderId: string, savePaymentMethod?: boolean) {
    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        ...(savePaymentMethod ? { savePaymentMethod: true } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((data as { error?: string }).error || "Checkout failed");
      return;
    }
    const url = (data as { url?: string }).url;
    if (url) window.location.assign(url);
    else toast.error("No checkout URL returned");
  }

  async function acceptAndPay(quoteId: string) {
    setActingId(quoteId);
    try {
      const acceptRes = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurring: false }),
      });
      const acceptData = await acceptRes.json().catch(() => ({}));
      if (!acceptRes.ok) {
        toast.error(
          (acceptData as { error?: string }).error || "Could not accept quote"
        );
        return;
      }
      const orderId = (acceptData as { orderId?: string }).orderId;
      if (!orderId) {
        toast.error("No order returned");
        return;
      }
      await checkoutAfterAccept(orderId);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  function openRecurring(quoteId: string) {
    setRecurringQuoteId(quoteId);
    setFrequency("WEEKLY");
    setRecurringOpen(true);
  }

  async function confirmRecurring() {
    if (!recurringQuoteId) return;
    setActingId(recurringQuoteId);
    try {
      const acceptRes = await fetch(`/api/quotes/${recurringQuoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurring: true, frequency }),
      });
      const acceptData = await acceptRes.json().catch(() => ({}));
      if (!acceptRes.ok) {
        toast.error(
          (acceptData as { error?: string }).error || "Could not accept quote"
        );
        return;
      }
      const orderId = (acceptData as { orderId?: string }).orderId;
      if (!orderId) {
        toast.error("No order returned");
        return;
      }
      setRecurringOpen(false);
      setRecurringQuoteId(null);
      await checkoutAfterAccept(orderId, true);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p className="text-muted-foreground mt-1">
          Review pricing from suppliers and complete checkout.
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="flex-1 min-w-[4rem]">
            All
          </TabsTrigger>
          <TabsTrigger value="REQUESTED" className="flex-1 min-w-[4rem]">
            Requested
          </TabsTrigger>
          <TabsTrigger value="PRICED" className="flex-1 min-w-[4rem]">
            Priced
          </TabsTrigger>
          <TabsTrigger value="ACCEPTED" className="flex-1 min-w-[4rem]">
            Accepted
          </TabsTrigger>
          <TabsTrigger value="EXPIRED" className="flex-1 min-w-[4rem]">
            Expired
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2 max-w-md">
        <Label htmlFor="quotes-search">Search suppliers</Label>
        <Input
          id="quotes-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by supplier name"
        />
      </div>

      <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept as recurring</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how often this order should repeat. You will be sent to
              checkout to pay the first cycle and save a payment method.
            </p>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Tabs
                value={frequency}
                onValueChange={(v) => setFrequency(v as RecurringFrequency)}
              >
                <TabsList className="grid w-full grid-cols-2 h-auto flex-wrap gap-1 p-1">
                  {FREQ_OPTIONS.map((opt) => (
                    <TabsTrigger
                      key={opt.value}
                      value={opt.value}
                      className="text-xs sm:text-sm"
                    >
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRecurringOpen(false);
                  setRecurringQuoteId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void confirmRecurring()}
                disabled={actingId === recurringQuoteId}
              >
                {actingId === recurringQuoteId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  "Continue to checkout"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-60" />
            <p className="font-medium text-foreground">No quotes</p>
            <p className="text-sm mt-1">
              {quotes.length === 0
                ? "Request a quote from a connected supplier to see it here."
                : "Nothing matches this filter or search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((quote) => {
            const busy = actingId === quote.id;
            const orderId = orderByQuoteId.get(quote.id);
            return (
              <Card key={quote.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {quote.supplier.name}
                      </CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={quoteStatusBadgeVariant(quote.status)}>
                          {quote.status}
                        </Badge>
                        <span>
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quote.status === "REQUESTED" && (
                    <p className="text-sm text-muted-foreground">
                      Waiting for pricing
                    </p>
                  )}

                  {quote.status === "PRICED" && (
                    <>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/40 text-left">
                              <th className="p-3 font-medium">Item</th>
                              <th className="p-3 font-medium text-right">Qty</th>
                              <th className="p-3 font-medium text-right">
                                Unit price
                              </th>
                              <th className="p-3 font-medium text-right">
                                Line total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {quote.lineItems.map((li) => (
                              <tr key={li.id} className="border-b last:border-0">
                                <td className="p-3">
                                  <span className="font-medium">{li.name}</span>
                                  {li.unit ? (
                                    <span className="text-muted-foreground ml-1">
                                      ({li.unit})
                                    </span>
                                  ) : null}
                                </td>
                                <td className="p-3 text-right tabular-nums">
                                  {li.quantity}
                                </td>
                                <td className="p-3 text-right tabular-nums">
                                  {li.unitPrice != null
                                    ? formatMoney(li.unitPrice)
                                    : "—"}
                                </td>
                                <td className="p-3 text-right tabular-nums font-medium">
                                  {li.lineTotal != null
                                    ? formatMoney(li.lineTotal)
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Separator />

                      <div className="space-y-1 text-sm max-w-xs ml-auto tabular-nums">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>
                            {quote.subtotal != null
                              ? formatMoney(quote.subtotal)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            Platform fee (1%)
                          </span>
                          <span>
                            {quote.platformFee != null
                              ? formatMoney(quote.platformFee)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 font-semibold pt-1 border-t">
                          <span>Total</span>
                          <span>
                            {quote.total != null
                              ? formatMoney(quote.total)
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={busy}
                          onClick={() => void acceptAndPay(quote.id)}
                          className="gap-2"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Accept & Pay
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => openRecurring(quote.id)}
                        >
                          Accept as Recurring
                        </Button>
                      </div>
                    </>
                  )}

                  {quote.status === "ACCEPTED" && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">Accepted</span>
                      {orderId ? (
                        <Link
                          href={`/dashboard/orders/${orderId}`}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          View order
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Order link will appear after refresh.
                        </span>
                      )}
                    </div>
                  )}

                  {quote.businessNotes ? (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor={`biz-${quote.id}`}>Your notes</Label>
                        <Textarea
                          id={`biz-${quote.id}`}
                          readOnly
                          value={quote.businessNotes}
                          rows={3}
                          className="resize-none bg-muted/30"
                        />
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
