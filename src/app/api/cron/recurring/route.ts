import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chargeRecurring, calculateFees } from "@/lib/stripe";

export const maxDuration = 120;

function advanceDate(date: Date, frequency: string): Date {
  const next = new Date(date);
  switch (frequency) {
    case "WEEKLY": next.setDate(next.getDate() + 7); break;
    case "BIWEEKLY": next.setDate(next.getDate() + 14); break;
    case "MONTHLY": next.setMonth(next.getMonth() + 1); break;
    case "QUARTERLY": next.setMonth(next.getMonth() + 3); break;
  }
  return next;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueOrders = await prisma.recurringOrder.findMany({
    where: {
      status: "ACTIVE",
      nextOrderDate: { lte: now },
    },
    include: { business: true, supplier: true },
  });

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const recurring of dueOrders) {
    if (recurring.skipNext) {
      await prisma.recurringOrder.update({
        where: { id: recurring.id },
        data: {
          skipNext: false,
          nextOrderDate: advanceDate(recurring.nextOrderDate, recurring.frequency),
        },
      });
      results.push({ id: recurring.id, status: "skipped" });
      continue;
    }

    if (!recurring.stripeCustomerId || !recurring.stripePaymentMethodId) {
      results.push({ id: recurring.id, status: "error", error: "No payment method saved" });
      continue;
    }

    try {
      const items = recurring.itemsSnapshot as Array<{
        name: string;
        description?: string;
        quantity: number;
        unit?: string;
        unitPrice: number;
        lineTotal: number;
      }>;

      const subtotal = items.reduce((sum, i) => sum + (i.lineTotal || i.quantity * i.unitPrice), 0);
      const fees = calculateFees(subtotal);

      const cycleCount = await prisma.order.count({
        where: { recurringOrderId: recurring.id },
      });

      const order = await prisma.order.create({
        data: {
          businessId: recurring.businessId,
          supplierId: recurring.supplierId,
          quoteId: recurring.quoteId,
          status: "PENDING_PAYMENT",
          subtotal: fees.subtotal,
          platformFee: fees.platformFee,
          total: fees.total,
          recurringOrderId: recurring.id,
          cycleNumber: cycleCount + 1,
          lineItems: {
            create: items.map((i) => ({
              name: i.name,
              description: i.description || null,
              quantity: i.quantity,
              unit: i.unit || null,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal || i.quantity * i.unitPrice,
            })),
          },
        },
      });

      const pi = await chargeRecurring({
        customerId: recurring.stripeCustomerId,
        paymentMethodId: recurring.stripePaymentMethodId,
        amountCents: Math.round(fees.total * 100),
        orderId: order.id,
        description: `Recurring order from ${recurring.business.name} - Cycle ${cycleCount + 1}`,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          stripePaymentIntentId: pi.id,
        },
      });

      await prisma.recurringOrder.update({
        where: { id: recurring.id },
        data: {
          nextOrderDate: advanceDate(recurring.nextOrderDate, recurring.frequency),
        },
      });

      results.push({ id: recurring.id, status: "charged" });
    } catch (error) {
      console.error(`Recurring order ${recurring.id} failed:`, error);
      results.push({
        id: recurring.id,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
