import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createClient()
    await supabase.auth.signOut()
    if (user) await logAudit({ action: "SIGN_OUT", actorUserId: user.id, req })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
