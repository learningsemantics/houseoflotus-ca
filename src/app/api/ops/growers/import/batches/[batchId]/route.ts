import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ batchId: string }> };

// ─── GET /api/ops/growers/import/batches/[batchId] ─

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { batchId } = await context.params;

    const batch = await db.importBatch.findUnique({
      where: { id: batchId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        importRecords: {
          orderBy: { rowNumber: "asc" },
          include: {
            grower: {
              select: { id: true, displayName: true, state: true },
            },
            matchedGrower: {
              select: { id: true, displayName: true, state: true },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Import batch not found" }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/import/batches/:batchId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
