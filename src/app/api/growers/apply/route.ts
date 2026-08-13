import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createGrowerSchema } from "@/lib/validations/grower";
import { logAudit } from "@/lib/audit";

// ─── POST /api/growers/apply — Public grower application ───
// No auth required. Creates a grower with APPLICATION_RECEIVED status.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Parse with the standard schema, then overlay fixed values
    const parsed = createGrowerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Require at least a display name
    if (!data.displayName?.trim()) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 },
      );
    }

    const grower = await db.grower.create({
      data: {
        displayName: data.displayName,
        legalName: data.legalName,
        growerType: data.growerType,
        coffeeBoardRegistration: data.coffeeBoardRegistration,
        coffeeBoardId: data.coffeeBoardId,
        registrationNumber: data.registrationNumber,
        taxId: data.taxId,
        establishedYear: data.establishedYear,
        website: data.website ?? null,

        // Contact (PII)
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactMethod: data.contactMethod,
        languages: data.languages,

        // Location
        country: "India",
        state: data.state,
        district: data.district,
        taluk: data.taluk,
        village: data.village,
        address: data.address,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,

        // Production
        totalAcreage: data.totalAcreage,
        coffeeAcreage: data.coffeeAcreage,
        annualProductionKg: data.annualProductionKg,
        annualExportVolumeKg: data.annualExportVolumeKg,

        // Coffee
        primarySpecies: data.primarySpecies,
        allSpecies: data.allSpecies,
        varietals: data.varietals,
        processingMethods: data.processingMethods,
        harvestMonths: data.harvestMonths,
        altitudeMinMeters: data.altitudeMinMeters,
        altitudeMaxMeters: data.altitudeMaxMeters,

        // Quality
        typicalCupScore: data.typicalCupScore,
        cuppingExperience: data.cuppingExperience,
        laboratoryTesting: data.laboratoryTesting,
        sampleAvailability: data.sampleAvailability,
        traceabilityCapability: data.traceabilityCapability,

        // Commercial
        typicalLotSizeKg: data.typicalLotSizeKg,
        minLotSizeKg: data.minLotSizeKg,
        exportExperience: data.exportExperience,
        existingExportMarkets: data.existingExportMarkets,
        preferredCommercialModel: data.preferredCommercialModel,
        priceExpectationUsdKg: data.priceExpectationUsdKg,
        packagingCapability: data.packagingCapability,

        // Infrastructure
        warehouseCapability: data.warehouseCapability,
        processingCapability: data.processingCapability,
        dryingCapability: data.dryingCapability,

        // Sustainability & Story
        sustainabilityPractices: data.sustainabilityPractices,
        growerStory: data.growerStory,
        buyerVisibleDescription: data.buyerVisibleDescription,

        // Pipeline — fixed for applications
        relationshipStatus: "APPLICATION_RECEIVED",
        visibility: "INTERNAL_ONLY",
      },
    });

    await logAudit({
      action: "GROWER_CREATED",
      actorUserId: null,
      growerId: grower.id,
      metadata: {
        source: "GROWER_APPLICATION",
        displayName: grower.displayName,
        growerType: grower.growerType,
      },
    });

    return NextResponse.json({ grower }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/growers/apply]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
