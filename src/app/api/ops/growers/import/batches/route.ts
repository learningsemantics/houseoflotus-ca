import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";

const BATCH_PAGE_SIZE = 20;

// ─── GET /api/ops/growers/import/batches ──────────────

export async function GET(request: NextRequest) {
  try {
    await requireOpsAdmin();
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      Math.max(1, Number(searchParams.get("pageSize")) || BATCH_PAGE_SIZE),
      100
    );

    const status = searchParams.get("status");
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [batches, totalItems] = await Promise.all([
      db.importBatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.importBatch.count({ where }),
    ]);

    return NextResponse.json({
      batches,
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
    console.error("[GET /ops/growers/import/batches]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
