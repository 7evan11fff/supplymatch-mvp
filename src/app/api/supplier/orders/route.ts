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

    const orders = await prisma.order.findMany({
      where: { supplierId },
      include: {
        business: { select: { name: true } },
        lineItems: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSupplier();
    const supplierId = await getSupplierId(session.user.id);
    const { orderId, status } = await request.json();

    const validTransitions: Record<string, string[]> = {
      PAID: ["PROCESSING"],
      PROCESSING: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
    };

    const order = await prisma.order.findFirst({
      where: { id: orderId, supplierId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
