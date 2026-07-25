import { NextRequest, NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function GET() {
  try {
    const user = await requireAuth()
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, firstName: true, lastName: true, jobTitle: true, phone: true, globalRole: true, createdAt: true } })
    return NextResponse.json({ profile: dbUser })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    await db.user.update({ where: { id: user.id }, data: { firstName: body.firstName, lastName: body.lastName, jobTitle: body.jobTitle, phone: body.phone } })
    await logAudit({ action: "PROFILE_UPDATED", actorUserId: user.id, targetType: "user", targetId: user.id, req })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}