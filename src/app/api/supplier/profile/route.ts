import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSupplier } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSupplier();
    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier profile not found" }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSupplier();
    const data = await request.json();

    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const updated = await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        name: data.name ?? supplier.name,
        industry: data.industry ?? supplier.industry,
        location: data.location ?? supplier.location,
        website: data.website ?? supplier.website,
        contactInfo: data.contactInfo ?? supplier.contactInfo,
        description: data.description ?? supplier.description,
        categories: data.categories ?? supplier.categories,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
