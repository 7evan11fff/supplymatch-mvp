import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { QuoteLineItem } from "@/generated/prisma";
import { requireBusiness } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireBusiness();
    const { id } = await params;
    const { recurring, frequency } = await request.json();

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const quote = await prisma.quote.findFirst({
      where: { id, businessId: business.id, status: "PRICED" },
      include: { lineItems: true },
    });
    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found or not priced yet" },
        { status: 404 }
      );
    }

    if (!quote.total || !quote.subtotal || !quote.platformFee) {
      return NextResponse.json(
        { error: "Quote has no pricing" },
        { status: 400 }
      );
    }

    await prisma.quote.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    const order = await prisma.order.create({
      data: {
        businessId: business.id,
        supplierId: quote.supplierId,
        quoteId: quote.id,
        status: "PENDING_PAYMENT",
        subtotal: quote.subtotal,
        platformFee: quote.platformFee,
        total: quote.total,
        lineItems: {
          create: quote.lineItems
            .filter((li: QuoteLineItem) => li.unitPrice !== null && li.lineTotal !== null)
            .map((li: QuoteLineItem) => ({
              name: li.name,
              description: li.description,
              quantity: li.quantity,
              unit: li.unit,
              unitPrice: li.unitPrice!,
              lineTotal: li.lineTotal!,
            })),
        },
      },
    });

    if (recurring && frequency) {
      const itemsSnapshot = quote.lineItems.map((li: QuoteLineItem) => ({
        name: li.name,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unitPrice: li.unitPrice,
        lineTotal: li.lineTotal,
      }));

      const nextDate = new Date();
      switch (frequency) {
        case "WEEKLY": nextDate.setDate(nextDate.getDate() + 7); break;
        case "BIWEEKLY": nextDate.setDate(nextDate.getDate() + 14); break;
        case "MONTHLY": nextDate.setMonth(nextDate.getMonth() + 1); break;
        case "QUARTERLY": nextDate.setMonth(nextDate.getMonth() + 3); break;
      }

      await prisma.recurringOrder.create({
        data: {
          businessId: business.id,
          supplierId: quote.supplierId,
          quoteId: quote.id,
          status: "ACTIVE",
          frequency,
          nextOrderDate: nextDate,
          itemsSnapshot,
          subtotal: quote.subtotal,
          platformFee: quote.platformFee,
          total: quote.total,
        },
      });
    }

    return NextResponse.json({ orderId: order.id });
  } catch {
    return NextResponse.json({ error: "Failed to accept quote" }, { status: 500 });
  }
}
