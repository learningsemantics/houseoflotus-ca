import { NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { AuthError } from "@/lib/supabase/server-client";
import { db } from "@/lib/db";

// ─── GET /api/growers/stats/summary ─────────────────────

export async function GET() {
  try {
    await requireOpsAdmin();

    // Run all independent counts in parallel
    const [
      totalGrowers,
      totalLots,
      availableLotsKgResult,
      sampleReadyLots,
      exportReadyLots,
      byRelationshipStatus,
      byVerificationStatus,
      bySpecies,
      byState,
    ] = await Promise.all([
      // Total growers
      db.grower.count(),

      // Total coffee lots
      db.coffeeLot.count(),

      // Total available Kg (AVAILABLE + RESERVED lots)
      db.coffeeLot.aggregate({
        _sum: { quantityKg: true },
        where: { status: { in: ["AVAILABLE", "RESERVED"] } },
      }),

      // Sample-ready lots
      db.coffeeLot.count({
        where: { sampleAvailable: true, status: { in: ["AVAILABLE", "RESERVED"] } },
      }),

      // Export-ready lots
      db.coffeeLot.count({
        where: { exportReady: true, status: { in: ["AVAILABLE", "RESERVED"] } },
      }),

      // Count by relationshipStatus
      db.grower.groupBy({
        by: ["relationshipStatus"],
        _count: { id: true },
      }),

      // Count by verificationStatus
      db.grower.groupBy({
        by: ["verificationStatus"],
        _count: { id: true },
      }),

      // Count by primarySpecies
      db.grower.groupBy({
        by: ["primarySpecies"],
        _count: { id: true },
      }),

      // Count by state
      db.grower.groupBy({
        by: ["state"],
        _count: { id: true },
        where: { state: { not: null } },
      }),
    ]);

    // Format grouped results as Record<string, number>
    const formatGrouped = (
      rows: { _count: { id: number }; [key: string]: unknown }[],
      key: string
    ): Record<string, number> => {
      const result: Record<string, number> = {};
      for (const row of rows) {
        const k = row[key] as string;
        result[k] = row._count.id;
      }
      return result;
    };

    return NextResponse.json({
      totalGrowers,
      byRelationshipStatus: formatGrouped(
        byRelationshipStatus as { _count: { id: number }; relationshipStatus: string }[],
        "relationshipStatus"
      ),
      byVerificationStatus: formatGrouped(
        byVerificationStatus as { _count: { id: number }; verificationStatus: string }[],
        "verificationStatus"
      ),
      byPrimarySpecies: formatGrouped(
        bySpecies as { _count: { id: number }; primarySpecies: string }[],
        "primarySpecies"
      ),
      byState: formatGrouped(
        byState as { _count: { id: number }; state: string }[],
        "state"
      ),
      coffeeLots: {
        total: totalLots,
        availableKg: availableLotsKgResult._sum.quantityKg ?? 0,
        sampleReady: sampleReadyLots,
        exportReady: exportReadyLots,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    console.error("[GET /growers/stats/summary]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
