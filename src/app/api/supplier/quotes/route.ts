import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSupplier } from "@/lib/session";

async function getSupplierId(userId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { userId },
  });
  if (!supplier) throw new Error("Supplier not found");
  return supplier.id;
}

export async function GET() {
  try {
    const session = await requireSupplier();
    const supplierId = await getSupplierId(session.user.id);

    const quotes = await prisma.quote.findMany({
      where: { supplierId },
      include: {
        business: { select: { name: true } },
        lineItems: true,
        booking: { select: { businessMessage: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSupplier();
    const supplierId = await getSupplierId(session.user.id);
    const data = await request.json();

    const { quoteId, lineItems, adminNotes } = data;

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, supplierId },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.status !== "REQUESTED") {
      return NextResponse.json({ error: "Quote is not in REQUESTED state" }, { status: 400 });
    }

    let subtotal = 0;
    const lineItemUpdates = [];

    for (const item of lineItems) {
      const lineTotal = (item.quantity ?? 0) * (item.unitPrice ?? 0);
      subtotal += lineTotal;
      lineItemUpdates.push(
        prisma.quoteLineItem.update({
          where: { id: item.id },
          data: {
            unitPrice: item.unitPrice,
            lineTotal,
          },
        })
      );
    }

    const platformFee = Math.round(subtotal * 0.01 * 100) / 100;
    const total = Math.round((subtotal + platformFee) * 100) / 100;

    await prisma.$transaction([
      ...lineItemUpdates,
      prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: "PRICED",
          subtotal,
          platformFee,
          total,
          adminNotes: adminNotes ?? quote.adminNotes,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to price quote" }, { status: 500 });
  }
}
