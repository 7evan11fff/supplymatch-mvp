import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { checkSupplierAvailability } from "@/lib/openai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireBusiness();
    const { supplierId, items } = await request.json();

    if (!supplierId || !items?.length) {
      return NextResponse.json(
        { error: "supplierId and items are required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const results = await checkSupplierAvailability(
      {
        name: supplier.name,
        industry: supplier.industry,
        description: supplier.description,
        categories: supplier.categories,
        website: supplier.website,
        location: supplier.location,
      },
      items
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
