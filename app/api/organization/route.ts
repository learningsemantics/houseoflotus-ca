import { NextRequest, NextResponse } from "next/server"
import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function GET() {
  try {
    const user = await requireAuth()
    const member = await db.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: { include: { buyerProfile: true, addresses: true } },
      },
    })
    if (!member) return NextResponse.json({ organization: null, buyerProfile: null, addresses: [] })
    return NextResponse.json({ organization: member.organization, buyerProfile: member.organization.buyerProfile, addresses: member.organization.addresses })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth()
    const member = await db.organizationMember.findFirst({ where: { userId: user.id } })
    if (!member || member.role !== "BUYER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = await req.json()
    const { organization, buyerProfile } = body
    await db.organization.update({ where: { id: member.organizationId }, data: { ...organization, updatedAt: new Date() } })
    if (buyerProfile) {
      await db.buyerProfile.upsert({ where: { organizationId: member.organizationId }, create: { organizationId: member.organizationId, ...buyerProfile }, update: { ...buyerProfile } })
    }
    await logAudit({ action: "ORGANIZATION_UPDATED", actorUserId: user.id, targetType: "organization", targetId: member.organizationId, req })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}