import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
