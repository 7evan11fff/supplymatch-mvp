import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const verified = searchParams.get("verified");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (verified !== null && verified !== undefined && verified !== "") {
      where.verified = verified === "true";
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(suppliers);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = await request.json();

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        industry: data.industry || null,
        location: data.location || null,
        website: data.website || null,
        contactInfo: data.contactInfo || null,
        description: data.description || null,
        categories: data.categories || null,
        source: data.source || "MANUAL",
        verified: data.verified ?? false,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Supplier ID required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: data.id },
      data: {
        name: data.name,
        industry: data.industry,
        location: data.location,
        website: data.website,
        contactInfo: data.contactInfo,
        description: data.description,
        categories: data.categories,
        verified: data.verified,
      },
    });

    return NextResponse.json(supplier);
  } catch {
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID required" },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
