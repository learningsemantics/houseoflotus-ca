import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Add code validation to the schema
    const code = body.code;
    if (!code) {
      return NextResponse.json(
        { error: "Invalid or missing reset code" },
        { status: 400 }
      );
    }

    // Validate password fields
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { password } = parsed.data;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Verify OTP with type 'recovery'
    const { data, error: verifyError } = await fetch(
      `${supabaseUrl}/auth/v1/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          type: "recovery",
          token: code,
        }),
      }
    ).then((r) => r.json());

    if (verifyError) {
      return NextResponse.json(
        { error: verifyError.message || "Invalid or expired reset code" },
        { status: 400 }
      );
    }

    // Update the user's password using the access token from verification
    const accessToken = data?.access_token;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to verify reset code" },
        { status: 400 }
      );
    }

    const { error: updateError } = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ password }),
      }
    ).then((r) => r.json());

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update password" },
        { status: 400 }
      );
    }

    // Log audit event
    const userId = data?.user?.id;
    await logAudit({
      action: "PASSWORD_RESET_COMPLETED",
      actorUserId: userId,
      metadata: { method: "email_recovery" },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
