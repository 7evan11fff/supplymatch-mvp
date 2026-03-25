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
      include: { locations: true },
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
    const { locations, ...leadData } = body;

    const lead = await prisma.lead.create({
      data: {
        businessName: leadData.businessName,
        website: leadData.website || null,
        industry: leadData.industry,
        isFranchise: leadData.isFranchise ?? false,
        locationCount: leadData.locationCount ?? 1,
        address: leadData.address || null,
        city: leadData.city || "Austin",
        state: leadData.state || "TX",
        zip: leadData.zip || null,
        generalPhone: leadData.generalPhone || null,
        generalEmail: leadData.generalEmail || null,
        managerName: leadData.managerName || null,
        managerEmail: leadData.managerEmail || null,
        managerPhone: leadData.managerPhone || null,
        ceoName: leadData.ceoName || null,
        ceoEmail: leadData.ceoEmail || null,
        ceoPhone: leadData.ceoPhone || null,
        additionalContacts: leadData.additionalContacts || null,
        notes: leadData.notes || null,
        status: leadData.status || "PROSPECT",
        priority: leadData.priority || "MEDIUM",
        ...(locations?.length && {
          locations: {
            create: locations,
          },
        }),
      },
      include: { locations: true },
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
    const { id, locations, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    if (locations !== undefined) {
      await prisma.leadLocation.deleteMany({ where: { leadId: id } });
      if (locations.length > 0) {
        await prisma.leadLocation.createMany({
          data: locations.map((loc: Record<string, unknown>) => ({
            ...loc,
            leadId: id,
            id: undefined,
          })),
        });
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: { locations: true },
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
