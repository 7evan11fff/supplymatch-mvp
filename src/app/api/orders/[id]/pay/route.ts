import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireBusiness();
    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: { id, businessId: business.id, status: "PENDING_PAYMENT" },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Order not found or already paid" },
        { status: 404 }
      );
    }

    await prisma.order.update({
      where: { id },
      data: {
        status: "PAID",
        stripePaymentIntentId: `demo_${Date.now()}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
