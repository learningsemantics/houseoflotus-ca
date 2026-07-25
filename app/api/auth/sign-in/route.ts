import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import { signInSchema } from "@/lib/validations/auth"
import { AuthError } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signInSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    if (error) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const userId = data.user.id
    await db.user.upsert({
      where: { id: userId },
      create: { id: userId, email: parsed.data.email, lastLoginAt: new Date() },
      update: { lastLoginAt: new Date() },
    })

    const member = await db.organizationMember.findFirst({
      where: { userId },
      include: { organization: { select: { id: true, status: true } } },
    })

    await logAudit({ action: "SIGN_IN", actorUserId: userId, req })

    return NextResponse.json({
      id: userId,
      email: data.user.email,
      hasOrganization: !!member,
      orgStatus: member?.organization.status ?? null,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 })
    }
    console.error("[sign-in]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
