import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { user, organization } = await requireRole("BUYER_ADMIN");
    const { memberId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || (role !== "BUYER_ADMIN" && role !== "BUYER_MEMBER")) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const member = await db.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: organization.id,
      },
      include: { user: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.userId === user.id && role === "BUYER_MEMBER") {
      const adminCount = await db.organizationMember.count({
        where: {
          organizationId: organization.id,
          role: "BUYER_ADMIN",
        },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the only admin. Promote another member first." },
          { status: 400 }
        );
      }
    }

    await db.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });

    await logAudit({
      action: "MEMBER_ROLE_CHANGED",
      actorUserId: user.id,
      organizationId: organization.id,
      metadata: {
        targetUserId: member.userId,
        targetUserEmail: member.user.email,
        oldRole: member.role,
        newRole: role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
        return NextResponse.json(
          { error: code === "UNAUTHORIZED" ? "Unauthorized" : "Insufficient permissions" },
          { status: code === "UNAUTHORIZED" ? 401 : 403 }
        );
      }
    }
    console.error("Team role PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
