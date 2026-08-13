import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { addNoteSchema } from "@/lib/validations/grower";

const NOTE_PAGE_SIZE = 50;

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/ops/growers/[id]/notes ─────────────────────

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireOpsAdmin();
    const { id } = await context.params;
    const { searchParams } = request.nextUrl;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { growerId: id };
    if (category) where.category = category;

    const [notes, totalItems] = await Promise.all([
      db.growerNote.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * NOTE_PAGE_SIZE,
        take: NOTE_PAGE_SIZE,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      db.growerNote.count({ where }),
    ]);

    return NextResponse.json({
      notes,
      pagination: {
        page,
        pageSize: NOTE_PAGE_SIZE,
        totalItems,
        totalPages: Math.ceil(totalItems / NOTE_PAGE_SIZE),
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[GET /ops/growers/:id/notes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/ops/growers/[id]/notes ────────────────────

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireOpsAdmin();
    const { id } = await context.params;

    const grower = await db.grower.findUnique({ where: { id }, select: { id: true } });
    if (!grower) {
      return NextResponse.json({ error: "Grower not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const note = await db.growerNote.create({
      data: {
        growerId: id,
        content: parsed.data.content,
        category: parsed.data.category,
        isPinned: parsed.data.isPinned ?? false,
        createdByUserId: user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/:id/notes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
