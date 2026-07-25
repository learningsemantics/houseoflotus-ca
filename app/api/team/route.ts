import { NextRequest, NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireAuth()
    const member = await db.organizationMember.findFirst({ where: { userId: user.id } })
    if (!member) return NextResponse.json({ members: [], invitations: [] })
    const [members, invitations] = await Promise.all([
      db.organizationMember.findMany({ where: { organizationId: member.organizationId }, include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }, orderBy: { joinedAt: "asc" } }),
      db.invitation.findMany({ where: { organizationId: member.organizationId, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
    ])
    return NextResponse.json({ members, invitations })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const member = await db.organizationMember.findFirst({ where: { userId: user.id } })
    if (!member || member.role !== "BUYER_ADMIN") return NextResponse.json({ error: "Only admins can invite" }, { status: 403 })
    const { email, role } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })
    const invite = await db.invitation.create({ data: { organizationId: member.organizationId, email: email.toLowerCase(), role: role || "BUYER_MEMBER", invitedByUserId: user.id, expiresAt: new Date(Date.now() + 7 * 86400000) } })
    await db.auditEvent.create({ data: { action: "TEAM_INVITATION_SENT", actorUserId: user.id, targetType: "invitation", targetId: invite.id } })
    return NextResponse.json({ invitation: invite }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}