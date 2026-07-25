import { NextRequest, NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    await db.invitation.update({ where: { id }, data: { status: "REVOKED" } })
    await logAudit({ action: "TEAM_INVITATION_REVOKED", actorUserId: user.id, targetType: "invitation", targetId: id, req })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}