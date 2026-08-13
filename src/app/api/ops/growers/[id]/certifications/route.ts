import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { addCertificationSchema } from "@/lib/validations/grower";
import { logAudit } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ops/growers/[id]/certifications ─────────────

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id } = await context.params;

    // Verify grower exists
    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const certifications = await db.growerCertification.findMany({
      where: { growerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        verifiedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ certifications });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id/certifications]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/ops/growers/[id]/certifications ────────────

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addCertificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for unique constraint violation (same type + cert number)
    if (data.certificateNumber) {
      const existing = await db.growerCertification.findFirst({
        where: {
          growerId: id,
          certificationType: data.certificationType,
          certificateNumber: data.certificateNumber,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A certification with this type and certificate number already exists for this grower" },
          { status: 409 }
        );
      }
    }

    const certification = await db.growerCertification.create({
      data: {
        growerId: id,
        certificationType: data.certificationType,
        certifyingBody: data.certifyingBody,
        certificateNumber: data.certificateNumber,
        certificateUrl: data.certificateUrl ?? null,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        notes: data.notes,
        createdByUserId: user.id,
      },
    });

    await logAudit({
      action: "CERTIFICATION_CREATED",
      actorUserId: user.id,
      growerId: id,
      metadata: {
        certificationId: certification.id,
        certificationType: certification.certificationType,
      },
    });

    return NextResponse.json({ certification }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/:id/certifications]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
