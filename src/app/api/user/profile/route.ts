import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseUser = await requireAuth();

    const user = await db.user.findUnique({
      where: { supabaseUid: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      jobTitle: user.jobTitle,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("User profile GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabaseUser = await requireAuth();

    const user = await db.user.findUnique({
      where: { supabaseUid: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ["firstName", "lastName", "jobTitle", "phone"];
    const updates: Record<string, string | null> = {};

    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key] || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: updates,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("User profile PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
