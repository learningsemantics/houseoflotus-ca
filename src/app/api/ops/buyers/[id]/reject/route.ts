import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const opsUser = await requireOpsAdmin();
    const { id } = await params;
    const body = await request.json();
    const reason = body?.reason;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { id } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (org.status !== "SUBMITTED" && org.status !== "UNDER_REVIEW") {
      return NextResponse.json({ error: `Cannot reject organization with status: ${org.status}` }, { status: 400 });
    }

    await db.organization.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason.trim(),
        reviewedAt: new Date(),
        reviewedByUserId: opsUser.id,
        infoRequestNotes: null,
      },
    });

    await logAudit({
      action: "ORG_REJECTED",
      actorUserId: opsUser.id,
      organizationId: id,
      metadata: { reason: reason.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Reject error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
