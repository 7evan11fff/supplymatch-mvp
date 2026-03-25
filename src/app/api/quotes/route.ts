import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusiness } from "@/lib/session";
import { priceQuoteItems } from "@/lib/openai";

export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (session.user.role === "ADMIN") {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const quotes = await prisma.quote.findMany({
        where,
        include: {
          business: true,
          supplier: true,
          lineItems: true,
          booking: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(quotes);
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) return NextResponse.json([]);

    const where: Record<string, unknown> = { businessId: business.id };
    if (status) where.status = status;

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        supplier: true,
        lineItems: true,
        booking: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireBusiness();
    const { bookingId, items, notes } = await request.json();

    if (!bookingId || !items?.length) {
      return NextResponse.json(
        { error: "Booking ID and items are required" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const booking = await prisma.bookingRequest.findFirst({
      where: { id: bookingId, businessId: business.id, status: "CONNECTED" },
    });
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or not in CONNECTED status" },
        { status: 404 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: booking.supplierId },
    });

    const quote = await prisma.quote.create({
      data: {
        businessId: business.id,
        supplierId: booking.supplierId,
        bookingId: booking.id,
        status: "REQUESTED",
        businessNotes: notes || null,
        lineItems: {
          create: items.map((item: { name: string; description?: string; quantity: number; unit?: string }) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unit: item.unit || null,
          })),
        },
      },
      include: { lineItems: true, supplier: true },
    });

    // Auto-price via AI (web search + estimation)
    try {
      const aiPrices = await priceQuoteItems(
        {
          name: supplier?.name ?? quote.supplier.name,
          website: supplier?.website ?? null,
          industry: supplier?.industry ?? null,
          description: supplier?.description ?? null,
          location: supplier?.location ?? null,
        },
        quote.lineItems.map((li) => ({
          name: li.name,
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
        }))
      );

      const priceMap = new Map(aiPrices.map((p) => [p.name, p]));
      let subtotal = 0;

      const lineItemUpdates = quote.lineItems.map((li) => {
        const priceInfo = priceMap.get(li.name);
        const unitPrice = priceInfo?.unitPrice ?? 0;
        const lineTotal = Math.round(unitPrice * li.quantity * 100) / 100;
        subtotal += lineTotal;

        return prisma.quoteLineItem.update({
          where: { id: li.id },
          data: { unitPrice, lineTotal },
        });
      });

      const platformFee = Math.round(subtotal * 0.01 * 100) / 100;
      const total = Math.round((subtotal + platformFee) * 100) / 100;

      await prisma.$transaction([
        ...lineItemUpdates,
        prisma.quote.update({
          where: { id: quote.id },
          data: {
            status: "PRICED",
            subtotal,
            platformFee,
            total,
            adminNotes: `AI auto-priced. Sources: ${aiPrices.map((p) => `${p.name}: ${p.source} (${p.confidence})`).join("; ")}`,
          },
        }),
      ]);

      const updatedQuote = await prisma.quote.findUnique({
        where: { id: quote.id },
        include: { lineItems: true, supplier: true },
      });

      return NextResponse.json(updatedQuote, { status: 201 });
    } catch {
      // If AI pricing fails, return the quote as REQUESTED (manual pricing fallback)
      return NextResponse.json(quote, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
