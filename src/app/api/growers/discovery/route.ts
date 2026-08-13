import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/supabase/server-client";
import { db } from "@/lib/db";
import { sanitizeGrowerList } from "@/lib/grower/sanitize";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/grower/constants";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// ─── Discovery Query Schema ──────────────────────────────

const discoveryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().max(200).optional(),
  state: z.string().optional(),
  species: z.string().optional(),
  processingMethod: z.string().optional(),
  certification: z.string().optional(),
  verificationStatus: z.string().optional(),
  sortBy: z.enum(["displayName", "typicalCupScore", "createdAt", "state"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── GET /api/growers/discovery ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Auth: BUYER_ADMIN or BUYER_MEMBER only
    await requireRole("BUYER_ADMIN", "BUYER_MEMBER");

    const { searchParams } = request.nextUrl;
    const parsed = discoveryQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { page, pageSize, search, sortBy, sortOrder } = parsed.data;

    // ── Base where: only visible to roasters ──
    const where: Prisma.GrowerWhereInput = {
      visibility: { in: ["APPROVED_ROASTERS_ONLY", "PUBLIC_PROFILE"] },
    };

    // ── Text search (non-PII fields only) ──
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { primarySpecies: { contains: search, mode: "insensitive" } },
        { growerStory: { contains: search, mode: "insensitive" } },
      ];
    }

    // ── State filter ──
    if (parsed.data.state) {
      where.state = parsed.data.state;
    }

    // ── Species filter ──
    if (parsed.data.species) {
      where.primarySpecies = parsed.data.species as Prisma.EnumCoffeeSpeciesFilter["equals"];
    }

    // ── Processing method filter (JSON array field) ──
    if (parsed.data.processingMethod) {
      where.processingMethods = { contains: parsed.data.processingMethod };
    }

    // ── Certification filter (requires relation) ──
    if (parsed.data.certification) {
      where.certifications = {
        some: {
          certificationType: parsed.data.certification as Prisma.EnumCertificationTypeFilter["equals"],
          status: { in: ["CLAIMED", "DOCUMENTED", "VERIFIED"] },
        },
      };
    }

    // ── Verification status filter ──
    if (parsed.data.verificationStatus) {
      where.verificationStatus = parsed.data.verificationStatus as Prisma.EnumOverallVerificationStatusFilter["equals"];
    }

    const skip = (page - 1) * pageSize;

    const [growers, totalItems] = await Promise.all([
      db.grower.findMany({
        where,
        include: {
          certifications: {
            select: {
              certificationType: true,
              certifyingBody: true,
              status: true,
              expiryDate: true,
            },
            where: { status: { in: ["CLAIMED", "DOCUMENTED", "VERIFIED"] } },
          },
          coffeeLots: {
            select: { lotCode: true },
            where: { status: { in: ["AVAILABLE", "RESERVED"] } },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      db.grower.count({ where }),
    ]);

    // Sanitize all growers — NO PII ever reaches the client
    const sanitized = sanitizeGrowerList(
      growers as Parameters<typeof sanitizeGrowerList>[0]
    );

    return NextResponse.json({
      growers: sanitized,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    console.error("[GET /growers/discovery]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
