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

    const org = await db.organization.findUnique({ where: { id } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const allowedStatuses = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION"];
    if (!allowedStatuses.includes(org.status)) {
      return NextResponse.json({ error: `Cannot approve organization with status: ${org.status}` }, { status: 400 });
    }

    await db.organization.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedByUserId: opsUser.id,
        rejectionReason: null,
        infoRequestNotes: null,
      },
    });

    await logAudit({
      action: "ORG_APPROVED",
      actorUserId: opsUser.id,
      organizationId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
