import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { runFullAnalysis } from "@/lib/matching";

export async function POST() {
  try {
    const session = await requireBusiness();

    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { _count: { select: { items: true } } },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Please complete your business profile first" },
        { status: 400 }
      );
    }

    if (business._count.items === 0) {
      return NextResponse.json(
        { error: "Please add at least one purchased item before running analysis" },
        { status: 400 }
      );
    }

    const result = await runFullAnalysis(business.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
