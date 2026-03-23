import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID required" },
        { status: 400 }
      );
    }

    if (session.user.role !== "ADMIN") {
      const business = await prisma.business.findUnique({
        where: { userId: session.user.id },
      });
      if (!business || business.id !== businessId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const matches = await prisma.supplierMatch.findMany({
      where: { businessId },
      include: {
        supplier: true,
        booking: { select: { id: true, status: true } },
      },
      orderBy: { matchScore: "desc" },
    });

    return NextResponse.json(matches);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
