import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness, requireSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    if (session.user.role === "ADMIN") {
      const status = searchParams.get("status");
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const bookings = await prisma.bookingRequest.findMany({
        where,
        include: {
          business: { include: { user: { select: { email: true, name: true } } } },
          supplier: true,
          match: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(bookings);
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json([]);
    }

    const bookings = await prisma.bookingRequest.findMany({
      where: { businessId: business.id },
      include: { supplier: true, match: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireBusiness();
    const { matchId, message } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const match = await prisma.supplierMatch.findFirst({
      where: { id: matchId, businessId: business.id },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const existingBooking = await prisma.bookingRequest.findUnique({
      where: { matchId },
    });
    if (existingBooking) {
      return NextResponse.json(
        { error: "Booking already exists for this match" },
        { status: 409 }
      );
    }

    const booking = await prisma.bookingRequest.create({
      data: {
        businessId: business.id,
        supplierId: match.supplierId,
        matchId: match.id,
        businessMessage: message || null,
        status: "PENDING_REVIEW",
      },
    });

    await prisma.supplierMatch.update({
      where: { id: matchId },
      data: { status: "BOOKED" },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { id, status, adminNotes } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Booking ID and status required" },
        { status: 400 }
      );
    }

    const booking = await prisma.bookingRequest.update({
      where: { id },
      data: {
        status,
        ...(adminNotes !== undefined && { adminNotes }),
      },
    });

    return NextResponse.json(booking);
  } catch {
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
