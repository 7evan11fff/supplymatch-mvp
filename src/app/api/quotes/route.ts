import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusiness } from "@/lib/session";

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

    return NextResponse.json(quote, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
