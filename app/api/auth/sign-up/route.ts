import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import { signUpSchema } from "@/lib/validations/auth"
import { AuthError } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { firstName, lastName, email, password } = parsed.data

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })
    if (error) {
      if (error.message.includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!data.user) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }

    await db.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email, firstName, lastName, emailVerified: false },
      update: { firstName, lastName },
    })

    await logAudit({ action: "SIGN_UP", actorUserId: data.user.id, req })

    return NextResponse.json({ id: data.user.id, email }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 })
    }
    console.error("[sign-up]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}