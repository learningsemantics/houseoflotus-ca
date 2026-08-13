import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header to identify the user
    const authHeader = request.headers.get("authorization");
    let userId: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      // Validate token with Supabase to get user
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const { data, error } = await fetch(
        `${supabaseUrl}/auth/v1/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseAnonKey,
          },
        }
      ).then((r) => r.json());

      if (!error && data?.id) {
        userId = data.id;
        await logAudit({
          action: "USER_SIGN_OUT",
          actorUserId: userId,
          metadata: { method: "token" },
        });
      }
    }

    // Even if we can't identify the user, sign out is always successful
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sign-out error:", err);
    // Sign out should always succeed
    return NextResponse.json({ success: true });
  }
}
