import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import type {
  GrowerRelationshipStatus,
  OverallVerificationStatus,
  GrowerVisibility,
} from "@prisma/client";

const VALID_RELATIONSHIP_STATUSES: GrowerRelationshipStatus[] = [
  "DISCOVERED", "IDENTIFIED", "CONTACTED", "RESPONDED", "INTERESTED",
  "INFORMATION_REQUESTED", "APPLICATION_STARTED", "APPLICATION_RECEIVED",
  "UNDER_VERIFICATION", "VERIFIED", "SAMPLE_REQUESTED", "SAMPLE_RECEIVED",
  "CUPPING", "QUALIFIED", "ACTIVE_GROWER", "DORMANT", "REJECTED",
];

const VALID_VERIFICATION_STATUSES: OverallVerificationStatus[] = [
  "UNVERIFIED", "PARTIALLY_VERIFIED", "VERIFIED", "VERIFICATION_EXPIRED", "SUSPENDED",
];

const VALID_VISIBILITIES: GrowerVisibility[] = [
  "INTERNAL_ONLY", "APPROVED_ROASTERS_ONLY", "SELECTED_ROASTERS", "PUBLIC_PROFILE",
];

const statusSchema = z.object({
  relationshipStatus: z.enum(VALID_RELATIONSHIP_STATUSES).optional(),
  verificationStatus: z.enum(VALID_VERIFICATION_STATUSES).optional(),
  visibility: z.enum(VALID_VISIBILITIES).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// ─── PATCH /api/ops/growers/[id]/status ──────────────────

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const existing = await db.grower.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "At least one status field is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedByUserId: user.id };

    if (data.verificationStatus === "VERIFIED") {
      updateData.lastVerifiedAt = new Date();
      updateData.lastVerifiedByUserId = user.id;
    }

    const updated = await db.grower.update({
      where: { id },
      data: { ...updateData, ...data },
    });

    // Audit each status change
    if (data.relationshipStatus && data.relationshipStatus !== existing.relationshipStatus) {
      await logAudit({
        action: "GROWER_STATUS_CHANGED",
        actorUserId: user.id,
        growerId: id,
        metadata: {
          field: "relationshipStatus",
          from: existing.relationshipStatus,
          to: data.relationshipStatus,
        },
      });
    }

    if (data.verificationStatus && data.verificationStatus !== existing.verificationStatus) {
      await logAudit({
        action: "GROWER_STATUS_CHANGED",
        actorUserId: user.id,
        growerId: id,
        metadata: {
          field: "verificationStatus",
          from: existing.verificationStatus,
          to: data.verificationStatus,
        },
      });
    }

    if (data.visibility && data.visibility !== existing.visibility) {
      await logAudit({
        action: "GROWER_STATUS_CHANGED",
        actorUserId: user.id,
        growerId: id,
        metadata: {
          field: "visibility",
          from: existing.visibility,
          to: data.visibility,
        },
      });
    }

    return NextResponse.json({ grower: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[PATCH /ops/growers/:id/status]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
