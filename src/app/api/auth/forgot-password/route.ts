import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        message: "If an account with that email exists, a temporary password has been generated.",
      });
    }

    const tempPassword = crypto.randomBytes(6).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // In production, send this via email instead of returning it
    return NextResponse.json({
      message: "A temporary password has been set for your account.",
      tempPassword,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
