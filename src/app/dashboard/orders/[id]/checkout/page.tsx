"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

interface OrderDetail {
  id: string;
  status: string;
  subtotal: number;
  platformFee: number;
  total: number;
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

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const fetchOrder = useCallback(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) setOrder(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();

    if (cardNumber.replace(/\s/g, "").length < 16) {
      toast.error("Please enter a valid card number");
      return;
    }

    setProcessing(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const res = await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Payment failed");
        return;
      }

      setPaid(true);

      setTimeout(() => {
        router.push(`/dashboard/orders/${id}?payment=success`);
      }, 2000);
    } catch {
      toast.error("Payment failed");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading checkout...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-muted-foreground">
        Order not found.
      </div>
    );
  }

  if (order.status !== "PENDING_PAYMENT") {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
        <p className="text-lg font-medium">This order has already been paid.</p>
        <Button onClick={() => router.push(`/dashboard/orders/${id}`)}>
          View Order
        </Button>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
        </div>
        <h2 className="text-2xl font-bold">Payment Successful!</h2>
        <p className="text-muted-foreground">
          Your order from {order.supplier.name} has been confirmed.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to your order...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground mt-1">
          Complete your payment to {order.supplier.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Payment form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                <span className="flex items-center gap-1.5 text-xs">
                  <Lock className="h-3 w-3" />
                  Demo checkout — no real payment will be processed
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePay} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-name">Name on card</Label>
                  <Input
                    id="card-name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-number">Card number</Label>
                  <div className="relative">
                    <Input
                      id="card-number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      required
                      className="pl-10"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry date</Label>
                    <Input
                      id="expiry"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <Separator className="my-2" />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing payment...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pay {formatMoney(order.total)}
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  This is a demo. No real charges will be made.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
              <CardDescription>{order.supplier.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.lineItems.map((li) => (
                  <div key={li.id} className="flex justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{li.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {li.quantity} {li.unit ?? "units"} x {formatMoney(li.unitPrice)}
                      </p>
                    </div>
                    <span className="tabular-nums font-medium shrink-0">
                      {formatMoney(li.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (2%)</span>
                  <span className="tabular-nums">{formatMoney(order.platformFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.push(`/dashboard/orders/${id}`)}
            >
              Cancel and return to order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
