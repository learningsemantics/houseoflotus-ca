import { NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { AuthError } from "@/lib/supabase/server-client";
import { db } from "@/lib/db";

// ─── Key provenance fields to measure coverage ──────────

const PROVENANCE_FIELDS = [
  "displayName",
  "legalName",
  "state",
  "district",
  "annualProductionKg",
  "primarySpecies",
  "processingMethods",
] as const;

// ─── GET /api/growers/stats/provenance-coverage ───────

export async function GET() {
  try {
    await requireOpsAdmin();

    const totalGrowers = await db.grower.count();

    // Run all field coverage queries in parallel
    const coverageResults = await Promise.all(
      PROVENANCE_FIELDS.map(async (field) => {
        // Growers with at least one provenance record for this field
        const withProvenance = await db.grower.count({
          where: {
            provenanceRecords: {
              some: { fieldName: field },
            },
          },
        });

        // Growers with at least one verified provenance record for this field
        const verified = await db.grower.count({
          where: {
            provenanceRecords: {
              some: { fieldName: field, isVerified: true },
            },
          },
        });

        return {
          field,
          totalWithProvenance: withProvenance,
          totalVerified: verified,
          percentageWithProvenance: totalGrowers > 0 ? Math.round((withProvenance / totalGrowers) * 10000) / 100 : 0,
          percentageVerified: totalGrowers > 0 ? Math.round((verified / totalGrowers) * 10000) / 100 : 0,
        };
      })
    );

    return NextResponse.json({
      totalGrowers,
      fields: coverageResults,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    console.error("[GET /growers/stats/provenance-coverage]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
