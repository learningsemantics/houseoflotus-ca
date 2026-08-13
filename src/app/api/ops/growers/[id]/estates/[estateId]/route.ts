import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string; estateId: string }> };

const updateEstateSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  taluk: z.string().max(100).optional(),
  village: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  altitudeMinMeters: z.number().int().min(0).max(3000).optional(),
  altitudeMaxMeters: z.number().int().min(0).max(3000).optional(),
  acreageHectares: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── PATCH /api/ops/growers/[id]/estates/[estateId] ──

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id, estateId } = await context.params;

    const estate = await db.estate.findFirst({
      where: { id: estateId, growerId: id },
    });
    if (!estate) {
      return NextResponse.json({ error: "Estate not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateEstateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await db.estate.update({
      where: { id: estateId },
      data: parsed.data,
    });

    await logAudit({
      action: "ESTATE_UPDATED",
      actorUserId: user.id,
      growerId: id,
      metadata: { estateId, changedFields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ estate: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[PATCH /ops/growers/:id/estates/:estateId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
