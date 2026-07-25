import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { forgotPasswordSchema } from "@/lib/validations/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    if (error) {
      console.error("[forgot-password]", error.message)
    }
    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[forgot-password]", err)
    return NextResponse.json({ success: true })
  }
}
