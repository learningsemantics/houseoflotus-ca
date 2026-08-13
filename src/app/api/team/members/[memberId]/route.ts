import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { user, organization } = await requireRole("BUYER_ADMIN");
    const { memberId } = await params;

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

    if (member.userId === user.id) {
      const adminCount = await db.organizationMember.count({
        where: {
          organizationId: organization.id,
          role: "BUYER_ADMIN",
        },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the only admin. Transfer admin role first." },
          { status: 400 }
        );
      }
    }

    await db.organizationMember.delete({
      where: { id: memberId },
    });

    await logAudit({
      action: "MEMBER_REMOVED",
      actorUserId: user.id,
      organizationId: organization.id,
      metadata: {
        removedUserId: member.userId,
        removedUserEmail: member.user.email,
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
    console.error("Team member DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
