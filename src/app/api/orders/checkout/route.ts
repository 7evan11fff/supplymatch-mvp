import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderLineItem } from "@/generated/prisma";
import { requireBusiness } from "@/lib/session";
import { createCheckoutSession, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await requireBusiness();
    const { orderId, savePaymentMethod } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId: business.id, status: "PENDING_PAYMENT" },
      include: { lineItems: true },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Order not found or already paid" },
        { status: 404 }
      );
    }

    const customerId = await getOrCreateStripeCustomer(
      business.id,
      business.user.email,
      business.name,
      business.stripeCustomerId
    );

    if (!business.stripeCustomerId) {
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = new URL(request.url).origin;

    const checkoutSession = await createCheckoutSession({
      customerId,
      lineItems: order.lineItems.map((li: OrderLineItem) => ({
        name: li.name,
        quantity: Math.round(li.quantity),
        unitAmountCents: Math.round(li.unitPrice * 100),
      })),
      platformFeeCents: Math.round(order.platformFee * 100),
      orderId: order.id,
      successUrl: `${origin}/dashboard/orders/${order.id}?payment=success`,
      cancelUrl: `${origin}/dashboard/orders/${order.id}?payment=cancelled`,
      savePaymentMethod: savePaymentMethod || false,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
