import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "asc" },
    });

    const users = await prisma.user.findMany({
      where: { role: "BUSINESS" },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const quotes = await prisma.quote.findMany({
      select: { status: true },
    });

    const matches = await prisma.supplierMatch.findMany({
      select: { matchScore: true },
    });

    // Revenue by month (last 6)
    const now = new Date();
    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const revenue = orders
        .filter((o) => {
          const created = new Date(o.createdAt);
          return (
            created >= d &&
            created < nextMonth &&
            o.status !== "CANCELLED" &&
            o.status !== "PENDING_PAYMENT"
          );
        })
        .reduce((sum, o) => sum + o.platformFee, 0);
      revenueByMonth.push({ month: label, revenue: Math.round(revenue * 100) / 100 });
    }

    // Signups by month (last 6)
    const signupsByMonth: Array<{ month: string; signups: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const signups = users.filter((u) => {
        const created = new Date(u.createdAt);
        return created >= d && created < nextMonth;
      }).length;
      signupsByMonth.push({ month: label, signups });
    }

    // Order funnel
    const orderFunnel = {
      quoted: quotes.length,
      accepted: quotes.filter((q) => q.status === "ACCEPTED").length,
      paid: orders.filter((o) => o.status !== "PENDING_PAYMENT" && o.status !== "CANCELLED").length,
      delivered: orders.filter((o) => o.status === "DELIVERED").length,
    };

    // Match quality distribution
    const scoreRanges = [
      { label: "0-25", min: 0, max: 25, count: 0 },
      { label: "26-50", min: 26, max: 50, count: 0 },
      { label: "51-75", min: 51, max: 75, count: 0 },
      { label: "76-100", min: 76, max: 100, count: 0 },
    ];
    for (const m of matches) {
      for (const range of scoreRanges) {
        if (m.matchScore >= range.min && m.matchScore <= range.max) {
          range.count++;
          break;
        }
      }
    }

    return NextResponse.json({
      revenueByMonth,
      signupsByMonth,
      orderFunnel,
      matchQuality: scoreRanges.map((r) => ({ range: r.label, count: r.count })),
      totals: {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue: orders
          .filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING_PAYMENT")
          .reduce((sum, o) => sum + o.platformFee, 0),
        totalGMV: orders
          .filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING_PAYMENT")
          .reduce((sum, o) => sum + o.total, 0),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
