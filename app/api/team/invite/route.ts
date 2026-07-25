import { NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const membership = await db.organizationMember.findFirst({
      where: { userId: user.id },
    })
    if (!membership || membership.role !== "BUYER_ADMIN") {
      throw new AuthError("FORBIDDEN", "Only organization admins can invite team members")
    }
    const body = await req.json()
    const { email, role } = body
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (role !== "BUYER_ADMIN" && role !== "BUYER_MEMBER") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    const existingMember = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingMember) {
      const existingMembership = await db.organizationMember.findFirst({
        where: { userId: existingMember.id, organizationId: membership.organizationId },
      })
      if (existingMembership) {
        return NextResponse.json({ error: "User is already a member" }, { status: 409 })
      }
    }
    const pendingInvitation = await db.invitation.findFirst({
      where: { organizationId: membership.organizationId, email: email.toLowerCase(), status: "PENDING" },
    })
    if (pendingInvitation) {
      return NextResponse.json({ error: "Invitation already pending" }, { status: 409 })
    }
    const invitation = await db.invitation.create({
      data: {
        organizationId: membership.organizationId,
        email: email.toLowerCase(),
        role,
        invitedByUserId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    await logAudit({
      action: "TEAM_INVITATION_SENT",
      actorUserId: user.id,
      targetType: "Invitation",
      targetId: invitation.id,
      details: { email: email.toLowerCase(), role },
      req,
    })
    return NextResponse.json({ invitation }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "FORBIDDEN" ? 403 : 401 })
    }
    console.error("POST /api/team/invite:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
