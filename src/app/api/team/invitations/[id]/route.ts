import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, organization } = await requireRole("BUYER_ADMIN");
    const { id } = await params;

    const invitation = await db.invitation.findFirst({
      where: {
        id,
        organizationId: organization.id,
        status: "PENDING",
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found or already used" }, { status: 404 });
    }

    await db.invitation.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    await logAudit({
      action: "MEMBER_REMOVED",
      actorUserId: user.id,
      organizationId: organization.id,
      metadata: { revokedInvitationId: id, revokedEmail: invitation.invitedEmail },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
        return NextResponse.json({ error: code === "UNAUTHORIZED" ? "Unauthorized" : "Insufficient permissions" }, { status: code === "UNAUTHORIZED" ? 401 : 403 });
      }
    }
    console.error("Team invitation DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
