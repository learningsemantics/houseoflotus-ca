import { NextRequest, NextResponse } from "next/server"
import { requireOpsAdmin } from "@/lib/ops-auth"
import { db } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOpsAdmin()
    const { id } = await params
    const { notes } = await req.json()
    const org = await db.organization.update({ where: { id }, data: { internalNotes: notes } })
    return NextResponse.json({ organization: org })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : err.code === "FORBIDDEN" ? 403 : 500 })
  }
}