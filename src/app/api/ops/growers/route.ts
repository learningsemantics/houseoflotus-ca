import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { createGrowerSchema, importQuerySchema } from "@/lib/validations/grower";
// Pagination defaults handled by importQuerySchema (DEFAULT_PAGE_SIZE=20, MAX_PAGE_SIZE=100)
import { logAudit } from "@/lib/audit";
import type {
  GrowerRelationshipStatus,
  OverallVerificationStatus,
  GrowerType,
  CoffeeSpecies,
  GrowerVisibility,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

// ─── Allowed sort fields ──────────────────────────────────

const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "displayName",
  "relationshipStatus",
  "verificationStatus",
  "primarySpecies",
  "state",
  "typicalCupScore",
  "lastContactDate",
  "nextActionDate",
]);

// ─── GET /api/ops/growers — List growers ───────────────────

export async function GET(request: NextRequest) {
  try {
    await requireOpsAdmin();
    const { searchParams } = request.nextUrl;

    // Parse and validate query params
    const parsed = importQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { page, pageSize, search, sortBy, sortOrder } = parsed.data;

    // Build where clause
    const where: Prisma.GrowerWhereInput = {};

    if (parsed.data.relationshipStatus) {
      where.relationshipStatus = parsed.data.relationshipStatus as GrowerRelationshipStatus;
    }

    if (parsed.data.verificationStatus) {
      where.verificationStatus = parsed.data.verificationStatus as OverallVerificationStatus;
    }

    if (parsed.data.growerType) {
      where.growerType = parsed.data.growerType as GrowerType;
    }

    if (parsed.data.state) {
      where.state = parsed.data.state;
    }

    if (parsed.data.primarySpecies) {
      where.primarySpecies = parsed.data.primarySpecies as CoffeeSpecies;
    }

    if (parsed.data.visibility) {
      where.visibility = parsed.data.visibility as GrowerVisibility;
    }

    if (parsed.data.hasSample) {
      where.sampleAvailability = true;
    }

    // Text search across multiple fields
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { legalName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { coffeeBoardId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Validate sort
    const field = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? "asc" : "desc";

    const skip = (page - 1) * pageSize;

    const [growers, totalItems] = await Promise.all([
      db.grower.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          growerType: true,
          relationshipStatus: true,
          verificationStatus: true,
          visibility: true,
          state: true,
          primarySpecies: true,
          typicalCupScore: true,
          lastContactDate: true,
          nextAction: true,
          nextActionDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [field]: order },
        skip,
        take: pageSize,
      }),
      db.grower.count({ where }),
    ]);

    return NextResponse.json({
      growers,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/ops/growers — Create grower ─────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireOpsAdmin();
    const body = await request.json();

    const parsed = createGrowerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

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
        country: data.country ?? "India",
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
        internalNotes: data.internalNotes,

        // Pipeline
        relationshipStatus: data.relationshipStatus,
        visibility: data.visibility,
        nextAction: data.nextAction,
        nextActionDate: data.nextActionDate
          ? new Date(data.nextActionDate)
          : undefined,

        // Ownership
        relationshipOwnerUserId: user.id,
        createdByUserId: user.id,
        updatedByUserId: user.id,
      },
    });

    await logAudit({
      action: "GROWER_CREATED",
      actorUserId: user.id,
      growerId: grower.id,
      metadata: { displayName: grower.displayName, growerType: grower.growerType },
    });

    return NextResponse.json({ grower }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
