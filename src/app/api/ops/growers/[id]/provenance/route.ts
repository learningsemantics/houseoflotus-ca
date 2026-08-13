import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { getGrowerProvenance } from "@/lib/grower/provenance";
import type { DataSourceType } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ops/growers/[id]/provenance ───────────────

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id } = await context.params;
    const { searchParams } = request.nextUrl;

    const options: {
      sourceType?: DataSourceType;
      isVerified?: boolean;
      fieldName?: string;
      limit?: number;
    } = {};

    const sourceType = searchParams.get("sourceType");
    if (sourceType) options.sourceType = sourceType as DataSourceType;

    const isVerified = searchParams.get("isVerified");
    if (isVerified !== null) options.isVerified = isVerified === "true";

    const fieldName = searchParams.get("fieldName");
    if (fieldName) options.fieldName = fieldName;

    const limit = searchParams.get("limit");
    if (limit) options.limit = Math.min(Number(limit), 200);

    const provenance = await getGrowerProvenance(id, options);

    return NextResponse.json({ provenance });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id/provenance]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
