import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/session";
import { calculateFees } from "@/lib/stripe";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        business: { include: { user: { select: { email: true, name: true } } } },
        supplier: true,
        lineItems: true,
        booking: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { lineItems, adminNotes, expiresAt } = await request.json();

    if (!lineItems?.length) {
      return NextResponse.json(
        { error: "Line items with pricing are required" },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await prisma.quoteLineItem.deleteMany({ where: { quoteId: id } });

    let subtotal = 0;
    const createdItems = [];
    for (const item of lineItems) {
      const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      subtotal += lineTotal;
      createdItems.push({
        quoteId: id,
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit || null,
        unitPrice: item.unitPrice,
        lineTotal,
      });
    }

    await prisma.quoteLineItem.createMany({ data: createdItems });

    const fees = calculateFees(subtotal);

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: "PRICED",
        subtotal: fees.subtotal,
        platformFee: fees.platformFee,
        total: fees.total,
        adminNotes: adminNotes || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: { lineItems: true, supplier: true, business: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
