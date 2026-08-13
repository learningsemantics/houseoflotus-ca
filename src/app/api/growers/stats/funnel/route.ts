import { NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { AuthError } from "@/lib/supabase/server-client";
import { db } from "@/lib/db";
import { PIPELINE_STAGES } from "@/lib/grower/constants";

// ─── GET /api/growers/stats/funnel ──────────────────────
// Returns the supply network funnel counts using PIPELINE_STAGES.

export async function GET() {
  try {
    await requireOpsAdmin();

    // Run counts for each stage in parallel
    const counts = await Promise.all(
      PIPELINE_STAGES.map(async (stage) => {
        const count = await db.grower.count({
          where: { relationshipStatus: { in: stage.statuses } },
        });
        return {
          stage: stage.label,
          label: stage.label,
          count,
          color: stage.color,
        };
      })
    );

    return NextResponse.json(counts);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    console.error("[GET /growers/stats/funnel]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
