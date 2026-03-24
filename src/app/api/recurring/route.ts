import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();

    if (session.user.role === "ADMIN") {
      const recurring = await prisma.recurringOrder.findMany({
        include: { business: true, supplier: true, orders: { orderBy: { createdAt: "desc" }, take: 3 } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(recurring);
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) return NextResponse.json([]);

    const recurring = await prisma.recurringOrder.findMany({
      where: { businessId: business.id },
      include: { supplier: true, orders: { orderBy: { createdAt: "desc" }, take: 3 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(recurring);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
