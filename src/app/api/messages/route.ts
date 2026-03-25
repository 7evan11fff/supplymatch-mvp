import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

async function verifyAccess(
  session: { user: { id: string; role: string } },
  quoteId: string | null,
  orderId: string | null
) {
  if (session.user.role === "ADMIN") return true;

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
  });
  if (!business) return false;

  if (quoteId) {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, businessId: business.id },
    });
    if (!quote) return false;
  }
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId: business.id },
    });
    if (!order) return false;
  }
  return true;
}

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

    if (!(await verifyAccess({ user: session.user as { id: string; role: string } }, quoteId, orderId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const where: Record<string, string> = {};
    if (quoteId) where.quoteId = quoteId;
    if (orderId) where.orderId = orderId;

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

    if (!(await verifyAccess({ user: session.user as { id: string; role: string } }, quoteId, orderId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
