import { NextRequest, NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const user = await requireAuth()
    const { memberId } = await params
    const { role } = await req.json()
    if (!role) return NextResponse.json({ error: "Role required" }, { status: 400 })
    const caller = await db.organizationMember.findFirst({ where: { userId: user.id } })
    if (!caller || caller.role !== "BUYER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (caller.id === memberId) return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
    await db.organizationMember.update({ where: { id: memberId }, data: { role } })
    await logAudit({ action: "MEMBER_ROLE_CHANGED", actorUserId: user.id, targetType: "member", targetId: memberId, details: { newRole: role }, req })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}