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
    const message = body?.message;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { id } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (org.status !== "SUBMITTED" && org.status !== "UNDER_REVIEW") {
      return NextResponse.json({ error: `Cannot request info for status: ${org.status}` }, { status: 400 });
    }

    await db.organization.update({
      where: { id },
      data: {
        status: "NEEDS_INFORMATION",
        infoRequestNotes: message.trim(),
        reviewedAt: new Date(),
        reviewedByUserId: opsUser.id,
        rejectionReason: null,
      },
    });

    await logAudit({
      action: "ORG_INFO_REQUESTED",
      actorUserId: opsUser.id,
      organizationId: id,
      metadata: { message: message.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Request info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
