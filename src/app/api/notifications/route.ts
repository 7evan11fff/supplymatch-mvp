import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });
    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const { action } = await request.json();

    if (action === "read-all") {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
