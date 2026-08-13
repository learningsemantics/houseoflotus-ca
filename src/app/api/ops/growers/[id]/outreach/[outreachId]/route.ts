import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import type { OutreachStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string; outreachId: string }> };

const updateOutreachSchema = z.object({
  status: z.enum([
    "SCHEDULED",
    "COMPLETED",
    "NO_RESPONSE",
    "REJECTED",
    "INTERESTED",
    "FOLLOW_UP_REQUIRED",
  ] as OutreachStatus[]),
  subject: z.string().max(500).optional(),
  content: z.string().max(10000).optional(),
  response: z.string().max(5000).optional(),
  completedDate: z.string().datetime().or(z.date()).optional(),
  followUpDate: z.string().datetime().or(z.date()).optional(),
});

// ─── PATCH /api/ops/growers/[id]/outreach/[outreachId] ──

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id, outreachId } = await context.params;

    const outreach = await db.growerOutreach.findFirst({
      where: { id: outreachId, growerId: id },
    });
    if (!outreach) {
      return NextResponse.json({ error: "Outreach not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateOutreachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updateData: Record<string, unknown> = {
      status: data.status,
      subject: data.subject,
      content: data.content,
      response: data.response,
    };

    if (data.completedDate) {
      updateData.completedDate = new Date(data.completedDate);
    } else if (data.status === "COMPLETED" && !outreach.completedDate) {
      updateData.completedDate = new Date();
    }

    if (data.followUpDate) {
      updateData.followUpDate = new Date(data.followUpDate);
    }

    const updated = await db.growerOutreach.update({
      where: { id: outreachId },
      data: updateData,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update grower lastContactDate on completion
    if (data.status && data.status !== "SCHEDULED" && outreach.status === "SCHEDULED") {
      await db.grower.update({
        where: { id },
        data: { lastContactDate: new Date() },
      });
    }

    await logAudit({
      action: "OUTREACH_COMPLETED",
      actorUserId: user.id,
      growerId: id,
      metadata: {
        outreachId,
        previousStatus: outreach.status,
        newStatus: data.status,
      },
    });

    return NextResponse.json({ outreach: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[PATCH /ops/growers/:id/outreach/:outreachId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
