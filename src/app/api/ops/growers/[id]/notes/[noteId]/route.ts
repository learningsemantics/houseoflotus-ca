import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { z } from "zod";

const togglePinSchema = z.object({
  isPinned: z.boolean(),
});

type RouteContext = { params: Promise<{ id: string; noteId: string }> };

// ─── PATCH /api/ops/growers/[id]/notes/[noteId] ─────────

export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id, noteId } = await context.params;

    const note = await db.growerNote.findFirst({
      where: { id: noteId, growerId: id },
    });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await _request.json();
    const parsed = togglePinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await db.growerNote.update({
      where: { id: noteId },
      data: { isPinned: parsed.data.isPinned },
    });

    return NextResponse.json({ note: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[PATCH /ops/growers/:id/notes/:noteId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/ops/growers/[id]/notes/[noteId] ───────

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id, noteId } = await context.params;

    const note = await db.growerNote.findFirst({
      where: { id: noteId, growerId: id },
    });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await db.growerNote.delete({ where: { id: noteId } });

    return NextResponse.json({ deleted: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[DELETE /ops/growers/:id/notes/:noteId]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
