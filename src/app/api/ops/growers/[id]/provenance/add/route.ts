import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { createProvenanceForField } from "@/lib/grower/provenance";
import { addProvenanceSchema } from "@/lib/validations/grower";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

// ─── POST /api/ops/growers/[id]/provenance/add ──────────

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addProvenanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Fetch current value of the field
    const growerRecord = await db.grower.findUnique({
      where: { id },
      select: { [data.fieldName]: true },
    });

    if (!growerRecord) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    // The current value is optional — if caller doesn't provide one we just
    // record that they sourced the field.
    const currentValue = (growerRecord as Record<string, unknown>)[data.fieldName];

    const provenance = await createProvenanceForField({
      growerId: id,
      fieldName: data.fieldName,
      newValue: currentValue ?? "(sourced, no value)",
      sourceType: data.sourceType,
      sourceName: data.sourceName,
      sourceReference: data.sourceReference,
      sourceUrl: data.sourceUrl,
      sourceDetail: data.sourceDetail,
      sourceDate: data.sourceDate ? new Date(data.sourceDate) : undefined,
      userId: user.id,
    });

    await logAudit({
      action: "PROVENANCE_CREATED",
      actorUserId: user.id,
      growerId: id,
      metadata: {
        provenanceId: provenance.id,
        fieldName: data.fieldName,
        sourceType: data.sourceType,
      },
    });

    return NextResponse.json({ provenance }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/:id/provenance/add]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
