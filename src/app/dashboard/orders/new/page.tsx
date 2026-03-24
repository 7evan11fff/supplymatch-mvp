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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  supplier: { name: string };
}

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  estimatedQuantity: string | null;
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

  const connected = useMemo(
    () => bookings.filter((b) => b.status === "CONNECTED"),
    [bookings]
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
      toast.success("Quote request submitted");
      router.push("/dashboard/orders");
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
          Choose a connected supplier and the items you want priced.
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
            <Label htmlFor="booking">Booking</Label>
            <Select
              value={bookingId}
              onValueChange={(v) => setBookingId(v ?? "")}
            >
              <SelectTrigger id="booking" className="w-full max-w-md">
                <SelectValue placeholder="Select supplier / booking" />
              </SelectTrigger>
              <SelectContent>
                {connected.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

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
                  return (
                    <li
                      key={it.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
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
                        <div>
                          <span className="font-medium">{it.name}</span>
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
                Submitting...
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
