import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireBusiness();
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { businessId: business.id },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    const quotes = await prisma.quote.findMany({
      where: { businessId: business.id },
    });

    const recurringOrders = await prisma.recurringOrder.findMany({
      where: { businessId: business.id, status: "ACTIVE" },
      include: { supplier: { select: { name: true } } },
      orderBy: { nextOrderDate: "asc" },
    });

    // Monthly spend for the last 6 months
    const now = new Date();
    const monthlySpend: Array<{ month: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const amount = orders
        .filter((o) => {
          const created = new Date(o.createdAt);
          return (
            created >= d &&
            created < nextMonth &&
            o.status !== "CANCELLED" &&
            o.status !== "PENDING_PAYMENT"
          );
        })
        .reduce((sum, o) => sum + o.total, 0);
      monthlySpend.push({ month: label, amount: Math.round(amount * 100) / 100 });
    }

    // Top suppliers by order volume
    const supplierTotals: Record<string, { name: string; total: number; count: number }> = {};
    for (const o of orders) {
      if (o.status === "CANCELLED") continue;
      const key = o.supplierId;
      if (!supplierTotals[key]) {
        supplierTotals[key] = { name: o.supplier.name, total: 0, count: 0 };
      }
      supplierTotals[key].total += o.total;
      supplierTotals[key].count += 1;
    }
    const topSuppliers = Object.values(supplierTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Quote acceptance rate
    const totalQuotes = quotes.length;
    const acceptedQuotes = quotes.filter((q) => q.status === "ACCEPTED").length;
    const quoteAcceptanceRate =
      totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

    // Upcoming recurring orders
    const upcomingRecurring = recurringOrders.slice(0, 5).map((r) => ({
      id: r.id,
      supplierName: r.supplier.name,
      frequency: r.frequency,
      nextDate: r.nextOrderDate,
      total: r.total,
    }));

    return NextResponse.json({
      monthlySpend,
      topSuppliers,
      quoteAcceptanceRate,
      totalQuotes,
      acceptedQuotes,
      upcomingRecurring,
      totalOrders: orders.length,
      totalSpend: orders
        .filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING_PAYMENT")
        .reduce((sum, o) => sum + o.total, 0),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
