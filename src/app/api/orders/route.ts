import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (session.user.role === "ADMIN") {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const orders = await prisma.order.findMany({
        where,
        include: {
          business: true,
          supplier: true,
          lineItems: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) return NextResponse.json([]);

    const where: Record<string, unknown> = { businessId: business.id };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        supplier: true,
        lineItems: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
