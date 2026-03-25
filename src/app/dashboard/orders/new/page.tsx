"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Booking {
  id: string;
  status: string;
  supplierId: string;
  supplier: { name: string };
}

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  estimatedQuantity: string | null;
}

interface AvailabilityResult {
  name: string;
  available: boolean;
  confidence: string;
  reason: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selection, setSelection] = useState<
    Record<string, { checked: boolean; quantity: string }>
  >({});

  const [availability, setAvailability] = useState<AvailabilityResult[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const connected = useMemo(
    () => bookings.filter((b) => b.status === "CONNECTED"),
    [bookings]
  );

  const selectedBooking = useMemo(
    () => connected.find((b) => b.id === bookingId),
    [connected, bookingId]
  );

  const fetchBookings = useCallback(() => {
    setLoadingBookings(true);
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .finally(() => setLoadingBookings(false));
  }, []);

  const fetchItems = useCallback(() => {
    setLoadingItems(true);
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
          setSelection(
            Object.fromEntries(
              data.map((it: CatalogItem) => [
                it.id,
                { checked: false, quantity: "1" },
              ])
            )
          );
        }
      })
      .finally(() => setLoadingItems(false));
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (connected.length > 0) fetchItems();
  }, [connected.length, fetchItems]);

  useEffect(() => {
    if (!bookingId || !selectedBooking || items.length === 0) {
      setAvailability([]);
      return;
    }

    setCheckingAvailability(true);
    setAvailability([]);

    fetch("/api/quotes/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: selectedBooking.supplierId,
        items: items.map((it) => ({
          name: it.name,
          category: it.category,
          description: it.description,
        })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.results) setAvailability(data.results);
      })
      .catch(() => {
        toast.error("Could not check item availability");
      })
      .finally(() => setCheckingAvailability(false));
  }, [bookingId, selectedBooking, items]);

  function getAvailability(itemName: string): AvailabilityResult | undefined {
    return availability.find(
      (a) => a.name.toLowerCase() === itemName.toLowerCase()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId) {
      toast.error("Select a supplier booking");
      return;
    }

    const payloadItems: Array<{
      name: string;
      description: string;
      quantity: number;
      unit: string | null;
    }> = [];

    for (const it of items) {
      const row = selection[it.id];
      if (!row?.checked) continue;
      const q = parseFloat(row.quantity);
      if (!Number.isFinite(q) || q <= 0) continue;
      payloadItems.push({
        name: it.name,
        description: it.description ?? "",
        quantity: q,
        unit: null,
      });
    }

    if (payloadItems.length === 0) {
      toast.error("Select at least one item with a valid quantity");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          items: payloadItems,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit quote request");
        return;
      }
      if (data.status === "PRICED") {
        toast.success(
          "Quote submitted and auto-priced by AI! Review it in your quotes."
        );
      } else {
        toast.success("Quote request submitted");
      }
      router.push("/dashboard/quotes");
    } catch {
      toast.error("Failed to submit quote request");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingBookings) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (connected.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard/orders"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 inline-flex items-center")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to orders
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>No connected suppliers</CardTitle>
            <CardDescription>
              You need an active connection with a supplier before you can
              request a quote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse recommendations and send a booking request first. Once an
              admin marks your booking as connected, you can return here.
            </p>
            <Link
              href="/dashboard/recommendations"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Go to recommendations
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unavailableCount = availability.filter((a) => !a.available).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard/orders"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 inline-flex items-center")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to orders
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Request a quote</h1>
        <p className="text-muted-foreground mt-1">
          Choose a connected supplier and the items you want priced. AI will
          check availability and auto-price your quote.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supplier</CardTitle>
            <CardDescription>
              Quotes are tied to one of your connected bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="booking">Supplier</Label>
            <select
              id="booking"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Select a supplier</option>
              {connected.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.supplier.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Availability status banner */}
        {bookingId && (checkingAvailability || availability.length > 0) && (
          <Card
            className={cn(
              "border-l-4",
              checkingAvailability
                ? "border-l-blue-500"
                : unavailableCount > 0
                  ? "border-l-amber-500"
                  : "border-l-green-500"
            )}
          >
            <CardContent className="py-3">
              {checkingAvailability ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is checking which items this supplier carries...
                </div>
              ) : unavailableCount > 0 ? (
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  {unavailableCount} item{unavailableCount !== 1 ? "s" : ""} may
                  not be available from this supplier. You can still include them
                  in your quote request.
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  All items appear to be available from this supplier.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              Check each item to include and set the quantity to quote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Loading your item catalog...
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items on file. Add items under Purchased Items first.
              </p>
            ) : (
              <ul className="space-y-4">
                {items.map((it) => {
                  const row = selection[it.id] ?? {
                    checked: false,
                    quantity: "1",
                  };
                  const avail = getAvailability(it.name);
                  return (
                    <li
                      key={it.id}
                      className={cn(
                        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center",
                        avail && !avail.available && "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20"
                      )}
                    >
                      <label className="flex flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 rounded border-input"
                          checked={row.checked}
                          onChange={(e) =>
                            setSelection((prev) => ({
                              ...prev,
                              [it.id]: {
                                ...row,
                                checked: e.target.checked,
                              },
                            }))
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{it.name}</span>
                            {avail && !checkingAvailability && (
                              avail.available ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                                  <XCircle className="h-3 w-3" />
                                  May not be available
                                </span>
                              )
                            )}
                            {checkingAvailability && bookingId && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{it.category}</Badge>
                            {it.estimatedQuantity && (
                              <span className="text-xs text-muted-foreground">
                                Typical: {it.estimatedQuantity}
                              </span>
                            )}
                          </div>
                          {it.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {it.description}
                            </p>
                          )}
                          {avail && !avail.available && !checkingAvailability && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {avail.reason}
                            </p>
                          )}
                        </div>
                      </label>
                      <div className="flex items-center gap-2 sm:w-40">
                        <Label htmlFor={`qty-${it.id}`} className="sr-only">
                          Quantity
                        </Label>
                        <Input
                          id={`qty-${it.id}`}
                          type="number"
                          min={0}
                          step="any"
                          value={row.quantity}
                          onChange={(e) =>
                            setSelection((prev) => ({
                              ...prev,
                              [it.id]: {
                                ...row,
                                quantity: e.target.value,
                              },
                            }))
                          }
                          disabled={!row.checked}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Optional context for the supplier.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery timing, specs, or other requests..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/orders"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={submitting || loadingItems}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI is pricing your quote...
              </>
            ) : (
              "Submit quote request"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
