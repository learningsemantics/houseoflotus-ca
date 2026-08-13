import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import type { CoffeeSpecies, ProcessingMethod, PriceBasis, GrowerVisibility } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string; lotId: string }> };

const updateLotSchema = z.object({
  lotCode: z.string().max(100).optional(),
  cropYear: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  species: z.enum(["ARABICA", "ROBUSTA", "LIBERICA", "EXCELSA"] as CoffeeSpecies[]).optional(),
  variety: z.string().max(200).optional(),
  process: z.enum(["WASHED", "NATURAL", "HONEY", "SEMI_WASHED", "PULPED_NATURAL", "WET_HULLING", "ANAEROBIC", "CARBONIC_MACERATION", "EXPERIMENTAL"] as ProcessingMethod[]).optional(),
  grade: z.string().max(100).optional(),
  altitudeMinMeters: z.number().int().min(0).max(3000).optional(),
  altitudeMaxMeters: z.number().int().min(0).max(3000).optional(),
  quantityKg: z.number().min(0).optional(),
  moqKg: z.number().min(0).optional(),
  moistureContent: z.number().min(0).max(30).optional(),
  waterActivity: z.number().min(0).max(1).optional(),
  cupScore: z.number().min(0).max(100).optional(),
  tastingNotes: z.string().max(3000).optional(),
  indicativePriceUsdKg: z.number().min(0).optional(),
  priceBasis: z.enum(["FOB_ORIGIN", "CIF_PORT", "EXW", "DDP", "OTHER"] as PriceBasis[]).optional(),
  packagingDescription: z.string().max(1000).optional(),
  sampleAvailable: z.boolean().optional(),
  exportReady: z.boolean().optional(),
  visibility: z.enum(["INTERNAL_ONLY", "APPROVED_ROASTERS_ONLY", "SELECTED_ROASTERS", "PUBLIC_PROFILE"] as GrowerVisibility[]).optional(),
  certifications: z.string().optional(),
  documentationStatus: z.string().max(50).optional(),
});

// ─── GET /api/ops/growers/[id]/lots/[lotId] ──────────

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id, lotId } = await context.params;

    const lot = await db.coffeeLot.findFirst({
      where: { id: lotId, growerId: id },
      include: {
        estate: { select: { id: true, name: true, state: true, district: true } },
        grower: { select: { id: true, displayName: true, state: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!lot) {
      return NextResponse.json({ error: "Coffee lot not found" }, { status: 404 });
    }

    return NextResponse.json({ lot });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id/lots/:lotId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/ops/growers/[id]/lots/[lotId] ─────────

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id, lotId } = await context.params;

    const existing = await db.coffeeLot.findFirst({
      where: { id: lotId, growerId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Coffee lot not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateLotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await db.coffeeLot.update({
      where: { id: lotId },
      data: parsed.data,
    });

    await logAudit({
      action: "COFFEE_LOT_UPDATED",
      actorUserId: user.id,
      growerId: id,
      metadata: { lotId, changedFields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ lot: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[PATCH /ops/growers/:id/lots/:lotId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
