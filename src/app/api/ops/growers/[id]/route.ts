import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { updateGrowerSchema } from "@/lib/validations/grower";
import { logAudit } from "@/lib/audit";
import { stripPiiFromObject } from "@/lib/grower/sanitize";
import { READINESS_WEIGHTS } from "@/lib/grower/constants";
import type { GrowerReadiness, ReadinessDimension, ReadinessItem } from "@/lib/grower/types";

// ─── Readiness calculator ────────────────────────────────

function computeReadiness(
  grower: Record<string, unknown>,
  estateCount: number,
  lotCount: number,
  certCount: number,
  verifiedCatCount: number
): GrowerReadiness {
  // Profile dimension (25%)
  const profileItems: ReadinessItem[] = [
    { field: "legalName", label: "Legal Name", complete: !!grower.legalName },
    { field: "contactName", label: "Contact Name", complete: !!grower.contactName },
    { field: "contactEmail", label: "Contact Email", complete: !!grower.contactEmail },
    { field: "state", label: "State", complete: !!grower.state },
    { field: "district", label: "District", complete: !!grower.district },
    { field: "primarySpecies", label: "Primary Species", complete: !!grower.primarySpecies },
    { field: "processingMethods", label: "Processing Methods", complete: !!grower.processingMethods },
    { field: "altitudeMinMeters", label: "Altitude Range", complete: !!(grower.altitudeMinMeters || grower.altitudeMaxMeters) },
    { field: "establishedYear", label: "Established Year", complete: !!grower.establishedYear },
    { field: "growerStory", label: "Grower Story", complete: !!grower.growerStory },
  ];
  const profileComplete = profileItems.filter((i) => i.complete).length;
  const profile: ReadinessDimension = {
    score: Math.round((profileComplete / profileItems.length) * 100),
    label: "Profile",
    items: profileItems,
  };

  // Verification dimension (20%)
  const verificationItems: ReadinessItem[] = [
    { field: "coffeeBoardRegistration", label: "Board Registration", complete: grower.coffeeBoardRegistration !== "UNKNOWN" },
    { field: "coffeeBoardId", label: "Coffee Board ID", complete: !!grower.coffeeBoardId },
    { field: "overallVerification", label: "Verified Status", complete: grower.verificationStatus === "VERIFIED" },
  ];
  const verificationComplete = verificationItems.filter((i) => i.complete).length;
  const verification: ReadinessDimension = {
    score: Math.round((verificationComplete / verificationItems.length) * 100),
    label: "Verification",
    items: verificationItems,
  };

  // Documentation dimension (15%)
  const documentationItems: ReadinessItem[] = [
    { field: "certifications", label: "Certifications", complete: certCount > 0 },
    { field: "laboratoryTesting", label: "Lab Testing", complete: !!grower.laboratoryTesting },
    { field: "evidenceRecords", label: "Evidence Records", complete: verifiedCatCount > 0 },
  ];
  const documentationComplete = documentationItems.filter((i) => i.complete).length;
  const documentation: ReadinessDimension = {
    score: Math.round((documentationComplete / documentationItems.length) * 100),
    label: "Documentation",
    items: documentationItems,
  };

  // Lot dimension (20%)
  const lotItems: ReadinessItem[] = [
    { field: "hasLots", label: "Has Coffee Lots", complete: lotCount > 0 },
    { field: "lotCode", label: "Lots Have Codes", complete: false }, // would need actual lot check
    { field: "cupScore", label: "Cup Score Recorded", complete: !!grower.typicalCupScore },
  ];
  const lotComplete = lotItems.filter((i) => i.complete).length;
  const lot: ReadinessDimension = {
    score: Math.round((lotComplete / lotItems.length) * 100),
    label: "Lot",
    items: lotItems,
  };

  // Sample dimension (10%)
  const sampleItems: ReadinessItem[] = [
    { field: "sampleAvailability", label: "Samples Available", complete: !!grower.sampleAvailability },
    { field: "traceability", label: "Traceability", complete: !!grower.traceabilityCapability },
  ];
  const sampleComplete = sampleItems.filter((i) => i.complete).length;
  const sample: ReadinessDimension = {
    score: Math.round((sampleComplete / sampleItems.length) * 100),
    label: "Sample",
    items: sampleItems,
  };

  // Export dimension (10%)
  const exportItems: ReadinessItem[] = [
    { field: "exportExperience", label: "Export Experience", complete: !!grower.exportExperience },
    { field: "typicalLotSizeKg", label: "Lot Size Defined", complete: !!grower.typicalLotSizeKg },
    { field: "existingExportMarkets", label: "Export Markets", complete: !!grower.existingExportMarkets },
  ];
  const exportComplete = exportItems.filter((i) => i.complete).length;
  const exp: ReadinessDimension = {
    score: Math.round((exportComplete / exportItems.length) * 100),
    label: "Export",
    items: exportItems,
  };

  const overall = Math.round(
    profile.score * READINESS_WEIGHTS.profile +
    verification.score * READINESS_WEIGHTS.verification +
    documentation.score * READINESS_WEIGHTS.documentation +
    lot.score * READINESS_WEIGHTS.lot +
    sample.score * READINESS_WEIGHTS.sample +
    exp.score * READINESS_WEIGHTS.export
  );

  return { profile, verification, documentation, lot, sample, export: exp, overall };
}

// ─── Route segment types ─────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ops/growers/[id] — Grower detail ───────────

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({
      where: { id },
      include: {
        relationshipOwner: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
        lastVerifiedBy: { select: { id: true, firstName: true, lastName: true } },
        verificationCategories: true,
      },
    });

    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    // Count related records in parallel
    const [estateCount, lotCount, noteCount, outreachCount, provenanceCount, certCount] =
      await Promise.all([
        db.estate.count({ where: { growerId: id } }),
        db.coffeeLot.count({ where: { growerId: id } }),
        db.growerNote.count({ where: { growerId: id } }),
        db.growerOutreach.count({ where: { growerId: id, status: "SCHEDULED" } }),
        db.growerProvenance.count({ where: { growerId: id } }),
        db.growerCertification.count({ where: { growerId: id } }),
      ]);

    const verifiedCatCount = grower.verificationCategories.filter(
      (c) => c.status === "VERIFIED"
    ).length;

    const readiness = computeReadiness(
      grower as unknown as Record<string, unknown>,
      estateCount,
      lotCount,
      certCount,
      verifiedCatCount
    );

    return NextResponse.json({
      ...grower,
      _readiness: readiness,
      _estateCount: estateCount,
      _lotCount: lotCount,
      _noteCount: noteCount,
      _outstandingOutreach: outreachCount,
      _provenanceCount: provenanceCount,
      _certCount: certCount,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/ops/growers/[id] — Update grower ─────────

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const existing = await db.grower.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateGrowerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build update data, handling date conversion
    const updateData: Record<string, unknown> = {
      updatedByUserId: user.id,
    };

    const directFields: (keyof typeof data)[] = [
      "legalName", "growerType", "coffeeBoardRegistration", "coffeeBoardId",
      "registrationNumber", "taxId", "establishedYear", "website",
      "contactName", "contactEmail", "contactPhone", "contactMethod", "languages",
      "country", "state", "district", "taluk", "village", "address", "postalCode",
      "latitude", "longitude",
      "totalAcreage", "coffeeAcreage", "annualProductionKg", "annualExportVolumeKg",
      "primarySpecies", "allSpecies", "varietals", "processingMethods", "harvestMonths",
      "altitudeMinMeters", "altitudeMaxMeters",
      "typicalCupScore", "cuppingExperience", "laboratoryTesting",
      "sampleAvailability", "traceabilityCapability",
      "typicalLotSizeKg", "minLotSizeKg", "exportExperience",
      "existingExportMarkets", "preferredCommercialModel", "priceExpectationUsdKg",
      "packagingCapability",
      "warehouseCapability", "processingCapability", "dryingCapability",
      "sustainabilityPractices", "growerStory", "buyerVisibleDescription", "internalNotes",
      "relationshipStatus", "visibility", "nextAction",
    ];

    for (const field of directFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (data.nextActionDate !== undefined) {
      updateData.nextActionDate = new Date(data.nextActionDate);
    }

    const updated = await db.grower.update({
      where: { id },
      data: updateData,
    });

    // Audit log (PII-stripped)
    const changedFields = Object.keys(data);
    await logAudit({
      action: "GROWER_UPDATED",
      actorUserId: user.id,
      growerId: id,
      metadata: {
        changedFields,
        nonPiiData: stripPiiFromObject(data as Record<string, unknown>),
      },
    });

    return NextResponse.json({ grower: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[PATCH /ops/growers/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
