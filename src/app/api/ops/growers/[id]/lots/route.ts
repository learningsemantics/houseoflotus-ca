import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { createCoffeeLotSchema } from "@/lib/validations/grower";
import { logAudit } from "@/lib/audit";
import type { LotStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ops/growers/[id]/lots ─────────────────────

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id } = await context.params;
    const { searchParams } = request.nextUrl;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { growerId: id };

    const status = searchParams.get("status");
    if (status) where.status = status as LotStatus;

    const species = searchParams.get("species");
    if (species) where.species = species;

    const cropYear = searchParams.get("cropYear");
    if (cropYear) where.cropYear = Number(cropYear);

    const lots = await db.coffeeLot.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        estate: { select: { id: true, name: true, state: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 200,
    });

    return NextResponse.json({ lots });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id/lots]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/ops/growers/[id]/lots ────────────────────

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    // Validate estate ownership if provided
    const body = await request.json();
    if (body.estateId) {
      const estate = await db.estate.findFirst({
        where: { id: body.estateId, growerId: id },
      });
      if (!estate) {
        return NextResponse.json(
          { error: "Estate not found or does not belong to this grower" },
          { status: 400 }
        );
      }
    }

    const parsed = createCoffeeLotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const lot = await db.coffeeLot.create({
      data: {
        growerId: id,
        estateId: data.estateId,
        lotCode: data.lotCode,
        cropYear: data.cropYear,
        species: data.species,
        variety: data.variety,
        process: data.process,
        grade: data.grade,
        altitudeMinMeters: data.altitudeMinMeters,
        altitudeMaxMeters: data.altitudeMaxMeters,
        quantityKg: data.quantityKg,
        moqKg: data.moqKg,
        moistureContent: data.moistureContent,
        waterActivity: data.waterActivity,
        cupScore: data.cupScore,
        tastingNotes: data.tastingNotes,
        harvestStart: data.harvestStart ? new Date(data.harvestStart) : undefined,
        harvestEnd: data.harvestEnd ? new Date(data.harvestEnd) : undefined,
        indicativePriceUsdKg: data.indicativePriceUsdKg,
        priceBasis: data.priceBasis,
        priceDate: data.priceDate ? new Date(data.priceDate) : undefined,
        currency: data.currency,
        packagingDescription: data.packagingDescription,
        sampleAvailable: data.sampleAvailable,
        exportReady: data.exportReady,
        visibility: data.visibility,
        certifications: data.certifications,
        documentationStatus: data.documentationStatus,
        createdByUserId: user.id,
      },
    });

    await logAudit({
      action: "COFFEE_LOT_CREATED",
      actorUserId: user.id,
      growerId: id,
      metadata: {
        lotId: lot.id,
        lotCode: lot.lotCode,
        species: lot.species,
        process: lot.process,
      },
    });

    return NextResponse.json({ lot }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/:id/lots]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
