import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get("quoteId");
    const orderId = searchParams.get("orderId");

    if (!quoteId && !orderId) {
      return NextResponse.json(
        { error: "quoteId or orderId required" },
        { status: 400 }
      );
    }

    const where: Record<string, string> = {};
    if (quoteId) where.quoteId = quoteId;
    if (orderId) where.orderId = orderId;

    // Verify user has access to this quote/order
    if (session.user.role === "BUSINESS") {
      const business = await prisma.business.findUnique({
        where: { userId: session.user.id },
      });
      if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 403 });
      }
      if (quoteId) {
        const quote = await prisma.quote.findFirst({
          where: { id: quoteId, businessId: business.id },
        });
        if (!quote) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: { id: orderId, businessId: business.id },
        });
        if (!order) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    } else if (session.user.role === "SUPPLIER") {
      const supplier = await prisma.supplier.findUnique({
        where: { userId: session.user.id },
      });
      if (!supplier) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 403 });
      }
      if (quoteId) {
        const quote = await prisma.quote.findFirst({
          where: { id: quoteId, supplierId: supplier.id },
        });
        if (!quote) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: { id: orderId, supplierId: supplier.id },
        });
        if (!order) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }
    // ADMIN has access to everything

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { quoteId, orderId, body } = await request.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body required" }, { status: 400 });
    }

    if (!quoteId && !orderId) {
      return NextResponse.json(
        { error: "quoteId or orderId required" },
        { status: 400 }
      );
    }

    // Verify access (same as GET)
    if (session.user.role === "BUSINESS") {
      const business = await prisma.business.findUnique({
        where: { userId: session.user.id },
      });
      if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 403 });
      }
      if (quoteId) {
        const quote = await prisma.quote.findFirst({
          where: { id: quoteId, businessId: business.id },
        });
        if (!quote) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: { id: orderId, businessId: business.id },
        });
        if (!order) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    } else if (session.user.role === "SUPPLIER") {
      const supplier = await prisma.supplier.findUnique({
        where: { userId: session.user.id },
      });
      if (!supplier) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 403 });
      }
      if (quoteId) {
        const quote = await prisma.quote.findFirst({
          where: { id: quoteId, supplierId: supplier.id },
        });
        if (!quote) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: { id: orderId, supplierId: supplier.id },
        });
        if (!order) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        quoteId: quoteId ?? null,
        orderId: orderId ?? null,
        body: body.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
