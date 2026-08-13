import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/supabase/server-client";
import { db } from "@/lib/db";
import { sanitizeGrowerForPublic, sanitizeLotForPublic } from "@/lib/grower/sanitize";

// ─── GET /api/growers/discovery/[id] ─────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth: BUYER_ADMIN or BUYER_MEMBER only
    await requireRole("BUYER_ADMIN", "BUYER_MEMBER");

    const { id } = await params;

    const grower = await db.grower.findUnique({
      where: { id },
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
        estates: {
          select: {
            id: true,
            name: true,
            state: true,
            altitudeMinMeters: true,
            altitudeMaxMeters: true,
          },
          where: { isActive: true },
        },
        coffeeLots: {
          where: {
            status: { in: ["AVAILABLE", "RESERVED"] },
          },
          include: {
            grower: {
              select: {
                displayName: true,
                state: true,
              },
            },
          },
        },
      },
    });

    // 404 if not found or not visible to roasters
    if (
      !grower ||
      (grower.visibility !== "APPROVED_ROASTERS_ONLY" && grower.visibility !== "PUBLIC_PROFILE")
    ) {
      return NextResponse.json(
        { error: "Grower not found" },
        { status: 404 }
      );
    }

    // Sanitize the grower profile
    const sanitizedGrower = sanitizeGrowerForPublic(grower);

    // Sanitize coffee lots
    const sanitizedLots = grower.coffeeLots.map((lot) =>
      sanitizeLotForPublic(lot as Parameters<typeof sanitizeLotForPublic>[0])
    );

    // Estates: only name, state, altitude (no PII concern here but explicitly limited)
    const limitedEstates = grower.estates.map((e) => ({
      id: e.id,
      name: e.name,
      state: e.state,
      altitudeMinMeters: e.altitudeMinMeters,
      altitudeMaxMeters: e.altitudeMaxMeters,
    }));

    return NextResponse.json({
      grower: sanitizedGrower,
      estates: limitedEstates,
      coffeeLots: sanitizedLots,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    console.error("[GET /growers/discovery/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
