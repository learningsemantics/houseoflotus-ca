import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Build the redirect URL for the reset password page
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_ORIGIN || "";
    const redirectTo = `${appUrl}/auth/reset-password`;

    // Call Supabase reset password
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email, redirect_to: redirectTo }),
    }).then((r) => r.json());

    // Always return success to prevent email enumeration
    // even if the email doesn't exist in Supabase
    await logAudit({
      action: "PASSWORD_RESET_REQUESTED",
      metadata: { email },
    });

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a reset link.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    // Still return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a reset link.",
    });
  }
}
