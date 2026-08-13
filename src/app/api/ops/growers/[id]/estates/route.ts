import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { createEstateSchema } from "@/lib/validations/grower";
import { logAudit } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ops/growers/[id]/estates ──────────────────

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const estates = await db.estate.findMany({
      where: { growerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { coffeeLots: true } },
      },
    });

    return NextResponse.json({ estates });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id/estates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/ops/growers/[id]/estates ─────────────────

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createEstateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Override growerId from URL to prevent cross-grower creation
    if (data.growerId !== id) {
      return NextResponse.json(
        { error: "growerId in body must match URL parameter" },
        { status: 400 }
      );
    }

    const estate = await db.estate.create({
      data: {
        growerId: id,
        name: data.name,
        state: data.state,
        district: data.district,
        taluk: data.taluk,
        village: data.village,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        altitudeMinMeters: data.altitudeMinMeters,
        altitudeMaxMeters: data.altitudeMaxMeters,
        acreageHectares: data.acreageHectares,
        createdByUserId: user.id,
      },
    });

    await logAudit({
      action: "ESTATE_CREATED",
      actorUserId: user.id,
      growerId: id,
      metadata: { estateId: estate.id, estateName: data.name },
    });

    return NextResponse.json({ estate }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/:id/estates]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
