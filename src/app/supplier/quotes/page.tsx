"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, DollarSign } from "lucide-react";
import { MessageThread } from "@/components/ui/message-thread";

interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  lineTotal: number | null;
}

interface Quote {
  id: string;
  status: string;
  subtotal: number | null;
  total: number | null;
  businessNotes: string | null;
  createdAt: string;
  business: { name: string };
  lineItems: LineItem[];
  booking: { businessMessage: string | null } | null;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

const TAB_ALL = "ALL";

export default function SupplierQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_ALL);
  const [pricingQuote, setPricingQuote] = useState<Quote | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchQuotes = useCallback(() => {
    setLoading(true);
    fetch("/api/supplier/quotes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setQuotes(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filtered = useMemo(() => {
    if (tab === TAB_ALL) return quotes;
    return quotes.filter((q) => q.status === tab);
  }, [quotes, tab]);

  function openPricing(quote: Quote) {
    setPricingQuote(quote);
    const initialPrices: Record<string, string> = {};
    quote.lineItems.forEach((li) => {
      initialPrices[li.id] = li.unitPrice?.toString() ?? "";
    });
    setPrices(initialPrices);
  }

  async function submitPricing() {
    if (!pricingQuote) return;

    const lineItems = pricingQuote.lineItems.map((li) => ({
      id: li.id,
      quantity: li.quantity,
      unitPrice: parseFloat(prices[li.id] || "0"),
    }));

    const allPriced = lineItems.every((li) => li.unitPrice > 0);
    if (!allPriced) {
      toast.error("Please set a price for all line items");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/supplier/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: pricingQuote.id, lineItems }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit pricing");
        return;
      }

      toast.success("Quote priced successfully!");
      setPricingQuote(null);
      fetchQuotes();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quote Requests</h1>
        <p className="text-muted-foreground mt-1">
          Review incoming quote requests and respond with your pricing.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value={TAB_ALL}>All</TabsTrigger>
          <TabsTrigger value="REQUESTED">Awaiting Price</TabsTrigger>
          <TabsTrigger value="PRICED">Priced</TabsTrigger>
          <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
          <TabsTrigger value="EXPIRED">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading quotes...
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-60" />
                <p className="font-medium text-foreground">No quotes</p>
                <p className="text-sm mt-1">
                  Quote requests from businesses will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((quote) => (
                <Card key={quote.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {quote.business.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(quote.createdAt).toLocaleDateString(
                            undefined,
                            { dateStyle: "medium" }
                          )}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          quote.status === "REQUESTED"
                            ? "secondary"
                            : quote.status === "ACCEPTED"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {quote.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quote.booking?.businessMessage && (
                      <div className="bg-muted/50 rounded-md p-3 text-sm">
                        <span className="font-medium">Business note: </span>
                        {quote.booking.businessMessage}
                      </div>
                    )}

                    <div className="rounded-md border divide-y">
                      {quote.lineItems.map((li) => (
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
                          {li.unitPrice != null && (
                            <span className="tabular-nums">
                              {formatMoney(li.unitPrice)} each ={" "}
                              <span className="font-medium">
                                {formatMoney(li.lineTotal ?? 0)}
                              </span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {quote.total != null && (
                      <>
                        <Separator />
                        <div className="flex justify-end text-sm">
                          <span className="font-semibold">
                            Total: {formatMoney(quote.total)}
                          </span>
                        </div>
                      </>
                    )}

                    {quote.status === "REQUESTED" && (
                      <Button onClick={() => openPricing(quote)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Set Pricing
                      </Button>
                    )}

                    <Separator />
                    <MessageThread quoteId={quote.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!pricingQuote}
        onOpenChange={(open) => !open && setPricingQuote(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Set Pricing</DialogTitle>
            <DialogDescription>
              Enter unit prices for each line item. The business will review your
              pricing and decide whether to accept.
            </DialogDescription>
          </DialogHeader>
          {pricingQuote && (
            <div className="space-y-4">
              {pricingQuote.lineItems.map((li) => (
                <div key={li.id} className="space-y-1.5">
                  <Label>
                    {li.name} (x{li.quantity}
                    {li.unit ? ` ${li.unit}` : ""})
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={prices[li.id] ?? ""}
                      onChange={(e) =>
                        setPrices({ ...prices, [li.id]: e.target.value })
                      }
                      placeholder="Unit price"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      per unit
                    </span>
                  </div>
                  {prices[li.id] && parseFloat(prices[li.id]) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Line total:{" "}
                      {formatMoney(parseFloat(prices[li.id]) * li.quantity)}
                    </p>
                  )}
                </div>
              ))}

              <Separator />

              <div className="flex justify-end text-sm font-semibold">
                Subtotal:{" "}
                {formatMoney(
                  pricingQuote.lineItems.reduce(
                    (sum, li) =>
                      sum +
                      (parseFloat(prices[li.id] || "0") || 0) * li.quantity,
                    0
                  )
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setPricingQuote(null)}
                >
                  Cancel
                </Button>
                <Button onClick={submitPricing} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Pricing"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
