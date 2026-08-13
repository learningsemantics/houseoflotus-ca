import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import type { ClaimStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string; certId: string }> };

const updateCertSchema = z.object({
  status: z.enum([
    "NOT_REVIEWED",
    "CLAIMED",
    "DOCUMENTED",
    "VERIFIED",
    "FAILED",
    "EXPIRED",
  ] as ClaimStatus[]),
  reviewerNotes: z.string().max(2000).optional(),
});

// ─── PATCH /api/ops/growers/[id]/certifications/[certId] ─

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id, certId } = await context.params;

    const cert = await db.growerCertification.findFirst({
      where: { id: certId, growerId: id },
    });
    if (!cert) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, reviewerNotes } = parsed.data;

    const updateData: Record<string, unknown> = { status };

    if (status === "VERIFIED") {
      updateData.verifiedByUserId = user.id;
      updateData.verifiedAt = new Date();
    }

    const updated = await db.growerCertification.update({
      where: { id: certId },
      data: updateData,
    });

    const auditAction = status === "VERIFIED" ? "CERTIFICATION_VERIFIED" : "CERTIFICATION_REJECTED";
    await logAudit({
      action: auditAction as "CERTIFICATION_VERIFIED" | "CERTIFICATION_REJECTED",
      actorUserId: user.id,
      growerId: id,
      metadata: {
        certificationId: certId,
        certificationType: cert.certificationType,
        previousStatus: cert.status,
        newStatus: status,
        reviewerNotes,
      },
    });

    return NextResponse.json({ certification: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[PATCH /ops/growers/:id/certifications/:certId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
