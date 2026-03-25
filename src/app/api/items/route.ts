import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";

async function getBusinessId() {
  const session = await requireBusiness();
  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
  });
  if (!business) throw new Error("Business not found");
  return business.id;
}

export async function GET() {
  try {
    const businessId = await getBusinessId();
    const items = await prisma.businessItem.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const businessId = await getBusinessId();
    const data = await request.json();

    const item = await prisma.businessItem.create({
      data: {
        businessId,
        name: data.name,
        category: data.category,
        description: data.description || null,
        estimatedQuantity: data.estimatedQuantity || null,
        purchaseFrequency: data.purchaseFrequency || null,
        specifications: data.specifications || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const businessId = await getBusinessId();
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const item = await prisma.businessItem.findFirst({
      where: { id: data.id, businessId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = await prisma.businessItem.update({
      where: { id: data.id },
      data: {
        name: data.name,
        category: data.category,
        description: data.description || null,
        estimatedQuantity: data.estimatedQuantity || null,
        purchaseFrequency: data.purchaseFrequency || null,
        specifications: data.specifications || null,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const businessId = await getBusinessId();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const item = await prisma.businessItem.findFirst({
      where: { id: itemId, businessId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.businessItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
