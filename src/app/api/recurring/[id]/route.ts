import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { calculateFees } from "@/lib/stripe";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireBusiness();
    const { id } = await params;
    const { action, items } = await request.json();

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const recurring = await prisma.recurringOrder.findFirst({
      where: { id, businessId: business.id },
    });
    if (!recurring) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    switch (action) {
      case "pause":
        await prisma.recurringOrder.update({
          where: { id },
          data: { status: "PAUSED" },
        });
        break;

      case "resume":
        await prisma.recurringOrder.update({
          where: { id },
          data: { status: "ACTIVE" },
        });
        break;

      case "skip":
        await prisma.recurringOrder.update({
          where: { id },
          data: { skipNext: true },
        });
        break;

      case "edit":
        if (!items?.length) {
          return NextResponse.json({ error: "Items required" }, { status: 400 });
        }
        const subtotal = items.reduce(
          (sum: number, i: { quantity: number; unitPrice: number }) =>
            sum + i.quantity * i.unitPrice,
          0
        );
        const fees = calculateFees(subtotal);
        await prisma.recurringOrder.update({
          where: { id },
          data: {
            itemsSnapshot: items,
            subtotal: fees.subtotal,
            platformFee: fees.platformFee,
            total: fees.total,
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.recurringOrder.findUnique({
      where: { id },
      include: { supplier: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.recurringOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
