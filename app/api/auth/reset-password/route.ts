import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest) {
  try {
    const { code, password } = await req.json()
    if (!code || !password) {
      return NextResponse.json({ error: "Code and password required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: code, type: "recovery" })
    if (error) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) await logAudit({ action: "PASSWORD_RESET_COMPLETED", actorUserId: user.id, req })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[reset-password]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
