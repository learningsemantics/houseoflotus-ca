import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireAuth()
    const member = await db.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: { select: { id: true, legalName: true, status: true, submittedAt: true, rejectionReason: true, internalNotes: true } } },
    })
    if (!member) return NextResponse.json({ hasOrganization: false })
    return NextResponse.json({ hasOrganization: true, ...member.organization })
  } catch {
    return NextResponse.json({ hasOrganization: false })
  }
}