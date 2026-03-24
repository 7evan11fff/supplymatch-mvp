import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { managerName: { contains: search, mode: "insensitive" } },
        { ceoName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(leads);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const lead = await prisma.lead.create({
      data: {
        businessName: body.businessName,
        website: body.website || null,
        industry: body.industry,
        isFranchise: body.isFranchise ?? false,
        locationCount: body.locationCount ?? 1,
        address: body.address || null,
        city: body.city || "Austin",
        state: body.state || "TX",
        zip: body.zip || null,
        generalPhone: body.generalPhone || null,
        generalEmail: body.generalEmail || null,
        managerName: body.managerName || null,
        managerEmail: body.managerEmail || null,
        managerPhone: body.managerPhone || null,
        ceoName: body.ceoName || null,
        ceoEmail: body.ceoEmail || null,
        ceoPhone: body.ceoPhone || null,
        additionalContacts: body.additionalContacts || null,
        notes: body.notes || null,
        status: body.status || "PROSPECT",
        priority: body.priority || "MEDIUM",
      },
    });

    return NextResponse.json(lead);
  } catch {
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    return NextResponse.json(lead);
  } catch {
    return NextResponse.json(
      { error: "Failed to update lead" },
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
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
