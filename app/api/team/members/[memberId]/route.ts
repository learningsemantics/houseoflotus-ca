import { NextRequest, NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const user = await requireAuth()
    const { memberId } = await params
    const caller = await db.organizationMember.findFirst({ where: { userId: user.id } })
    if (!caller || caller.role !== "BUYER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (caller.id === memberId) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
    const adminCount = await db.organizationMember.count({ where: { organizationId: caller.organizationId, role: "BUYER_ADMIN" } })
    const target = await db.organizationMember.findUnique({ where: { id: memberId } })
    if (target?.role === "BUYER_ADMIN" && adminCount <= 1) return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 })
    await db.organizationMember.delete({ where: { id: memberId } })
    await logAudit({ action: "TEAM_MEMBER_REMOVED", actorUserId: user.id, targetType: "member", targetId: memberId, req })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}