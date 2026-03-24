"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign } from "lucide-react";

interface Quote {
  id: string;
  status: string;
  subtotal: number | null;
  platformFee: number | null;
  total: number | null;
  businessNotes: string | null;
  adminNotes: string | null;
  createdAt: string;
  business: { name: string; industry: string };
  supplier: { name: string };
  lineItems: Array<{
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string | null;
    unitPrice: number | null;
    lineTotal: number | null;
  }>;
}

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  REQUESTED: "secondary",
  PRICED: "outline",
  ACCEPTED: "default",
  EXPIRED: "destructive",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("REQUESTED");
  const [pricingQuote, setPricingQuote] = useState<Quote | null>(null);
  const [draftLines, setDraftLines] = useState<
    Array<{
      name: string;
      description: string | null;
      quantity: number;
      unit: string | null;
      unitPrice: string;
    }>
  >([]);
  const [draftAdminNotes, setDraftAdminNotes] = useState("");
  const [draftExpiresAt, setDraftExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchQuotes = useCallback(() => {
    setLoading(true);
    fetch("/api/quotes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setQuotes(data);
        else toast.error("Failed to load quotes");
      })
      .catch(() => toast.error("Failed to load quotes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  useEffect(() => {
    if (!pricingQuote) {
      setDraftLines([]);
      setDraftAdminNotes("");
      setDraftExpiresAt("");
      return;
    }
    setDraftLines(
      pricingQuote.lineItems.map((li) => ({
        name: li.name,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unitPrice:
          li.unitPrice != null && !Number.isNaN(li.unitPrice)
            ? String(li.unitPrice)
            : "",
      }))
    );
    setDraftAdminNotes(pricingQuote.adminNotes ?? "");
    setDraftExpiresAt("");
  }, [pricingQuote]);

  const requestedCount = quotes.filter((q) => q.status === "REQUESTED").length;

  const filtered =
    tab === "ALL"
      ? quotes
      : quotes.filter((q) => q.status === tab);

  async function submitPricing() {
    if (!pricingQuote) return;
    const parsed = draftLines.map((row) => {
      const p = parseFloat(row.unitPrice);
      return { ...row, unitPriceNum: p };
    });
    if (parsed.some((r) => Number.isNaN(r.unitPriceNum) || r.unitPriceNum < 0)) {
      toast.error("Enter a valid unit price for every line");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${pricingQuote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: parsed.map((r) => ({
            name: r.name,
            description: r.description,
            quantity: r.quantity,
            unit: r.unit,
            unitPrice: r.unitPriceNum,
          })),
          adminNotes: draftAdminNotes.trim() || null,
          expiresAt: draftExpiresAt.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Quote priced");
      setPricingQuote(null);
      fetchQuotes();
    } catch {
      toast.error("Failed to save pricing");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quotes</h1>
        <p className="text-muted-foreground mt-1">
          Review requests, set pricing, and track quote status.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 py-1">
          <TabsTrigger value="REQUESTED">
            Requested (needs pricing) ({requestedCount})
          </TabsTrigger>
          <TabsTrigger value="PRICED">
            Priced (waiting for business)
          </TabsTrigger>
          <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No quotes in this category.
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((quote) => (
                <Card key={quote.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          {quote.business.name} · {quote.supplier.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {quote.business.industry} · {formatDate(quote.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusBadge[quote.status] ?? "secondary"}>
                          {quote.status.replace(/_/g, " ")}
                        </Badge>
                        {quote.status !== "REQUESTED" && (
                          <span className="text-sm text-muted-foreground">
                            Total {formatMoney(quote.total)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quote.businessNotes ? (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Business notes
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {quote.businessNotes}
                        </p>
                      </div>
                    ) : null}
                    {quote.adminNotes ? (
                      <div className="rounded-md border p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Admin notes
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {quote.adminNotes}
                        </p>
                      </div>
                    ) : null}
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      {quote.lineItems.length} line item
                      {quote.lineItems.length === 1 ? "" : "s"}
                    </p>
                    {quote.status === "REQUESTED" ? (
                      <Button
                        size="sm"
                        onClick={() => setPricingQuote(quote)}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Set pricing
                      </Button>
                    ) : null}
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
            <DialogTitle>Set pricing</DialogTitle>
          </DialogHeader>
          {pricingQuote ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {pricingQuote.business.name} → {pricingQuote.supplier.name}
              </p>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {draftLines.map((row, i) => (
                  <div
                    key={`${row.name}-${i}`}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <p className="font-medium text-sm">{row.name}</p>
                    {row.description ? (
                      <p className="text-xs text-muted-foreground">
                        {row.description}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Qty {row.quantity}
                      {row.unit ? ` ${row.unit}` : ""}
                    </p>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`unit-${i}`}>Unit price</Label>
                        <Input
                          id={`unit-${i}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={row.unitPrice}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDraftLines((prev) =>
                              prev.map((p, j) =>
                                j === i ? { ...p, unitPrice: v } : p
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-notes">Admin notes</Label>
                <Textarea
                  id="admin-notes"
                  rows={3}
                  value={draftAdminNotes}
                  onChange={(e) => setDraftAdminNotes(e.target.value)}
                  placeholder="Optional notes for the business"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expires">Expiry</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={draftExpiresAt}
                  onChange={(e) => setDraftExpiresAt(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPricingQuote(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={() => void submitPricing()} disabled={saving}>
                  {saving ? "Saving…" : "Save pricing"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
