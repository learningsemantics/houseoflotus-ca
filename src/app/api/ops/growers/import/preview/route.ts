import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { previewImport } from "@/lib/grower/import/coffee-board";
import { logAudit } from "@/lib/audit";

// ─── POST /api/ops/growers/import/preview ─────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireOpsAdmin();
    const body = await request.json();

    const { csvContent, sourceName, sourceReference } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json(
        { error: "csvContent is required and must be a string" },
        { status: 400 }
      );
    }

    if (csvContent.length > 5_000_000) {
      return NextResponse.json(
        { error: "CSV content exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const result = await previewImport(csvContent);

    await logAudit({
      action: "DATA_IMPORTED",
      actorUserId: user.id,
      metadata: {
        type: "preview",
        totalRows: result.totalRows,
        newGrowers: result.newGrowers,
        possibleMatches: result.possibleMatches,
        duplicates: result.duplicates,
        errorRows: result.errorRows,
        sourceName: sourceName ?? null,
        sourceReference: sourceReference ?? null,
      },
    });

    return NextResponse.json({ preview: result });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/import/preview]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
