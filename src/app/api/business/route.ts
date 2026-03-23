import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireBusiness();
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });
    return NextResponse.json(business);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireBusiness();
    const data = await request.json();

    const existing = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      const business = await prisma.business.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          industry: data.industry,
          location: data.location,
          description: data.description,
          operatingDetails: data.operatingDetails || null,
          profileComplete: true,
        },
      });
      return NextResponse.json(business);
    }

    const business = await prisma.business.create({
      data: {
        userId: session.user.id,
        name: data.name,
        industry: data.industry,
        location: data.location,
        description: data.description,
        operatingDetails: data.operatingDetails || null,
        profileComplete: true,
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
