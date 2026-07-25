import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ user: null })

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: {
          include: { organization: { select: { id: true, legalName: true, status: true } } },
          take: 1,
        },
      },
    })

    const member = dbUser?.memberships[0]
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: dbUser?.firstName,
        lastName: dbUser?.lastName,
        globalRole: dbUser?.globalRole,
        isInternal: dbUser?.isInternal,
      },
      organization: member ? {
        id: member.organization.id,
        legalName: member.organization.legalName,
        status: member.organization.status,
        role: member.role,
      } : null,
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
