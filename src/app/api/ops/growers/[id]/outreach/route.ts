import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { addOutreachSchema } from "@/lib/validations/grower";
import { logAudit } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ops/growers/[id]/outreach ──────────────────

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id } = await context.params;
    const { searchParams } = request.nextUrl;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { growerId: id };

    const status = searchParams.get("status");
    if (status) where.status = status;

    const outreachType = searchParams.get("outreachType");
    if (outreachType) where.outreachType = outreachType;

    const outreach = await db.growerOutreach.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 100,
    });

    return NextResponse.json({ outreach });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id/outreach]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/ops/growers/[id]/outreach ─────────────────

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addOutreachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const outreach = await db.growerOutreach.create({
      data: {
        growerId: id,
        outreachType: data.outreachType,
        scheduledDate: new Date(data.scheduledDate),
        subject: data.subject,
        content: data.content,
        status: data.status ?? "SCHEDULED",
        response: data.response,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        createdByUserId: user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update last contact date on grower if outreach is completed
    if (data.status && data.status !== "SCHEDULED") {
      await db.grower.update({
        where: { id },
        data: { lastContactDate: new Date() },
      });
    }

    await logAudit({
      action: "OUTREACH_LOGGED",
      actorUserId: user.id,
      growerId: id,
      metadata: {
        outreachId: outreach.id,
        outreachType: data.outreachType,
        status: data.status ?? "SCHEDULED",
      },
    });

    return NextResponse.json({ outreach }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/:id/outreach]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
