import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { requireAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";

type UserWithBusinessCounts = Prisma.UserGetPayload<{
  include: {
    business: {
      include: {
        _count: { select: { items: true; matches: true; bookings: true } };
      };
    };
  };
}>;

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { role: "BUSINESS" };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { business: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        business: {
          include: {
            _count: { select: { items: true, matches: true, bookings: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clients = users.map((u: UserWithBusinessCounts) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      business: u.business
        ? {
            id: u.business.id,
            name: u.business.name,
            industry: u.business.industry,
            location: u.business.location,
            profileComplete: u.business.profileComplete,
            itemCount: u.business._count.items,
            matchCount: u.business._count.matches,
            bookingCount: u.business._count.bookings,
          }
        : null,
    }));

    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "User ID and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "BUSINESS") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "BUSINESS") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
