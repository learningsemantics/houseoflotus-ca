import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { signUpSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = parsed.data;

    // Create Supabase auth user using the service-role client
    // For email/password signup, we use the anon client via admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const { data, error } = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      }),
    }).then((r) => r.json());

    if (error) {
      const message =
        error.message || error.msg || "Failed to create account";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Create User record in Prisma
    await db.user.upsert({
      where: { supabaseUid: userId },
      create: {
        supabaseUid: userId,
        email,
        firstName,
        lastName,
      },
      update: {
        email,
        firstName,
        lastName,
      },
    });

    // Log audit event
    await logAudit({
      action: "USER_SIGN_UP",
      actorUserId: userId,
      metadata: { email, method: "email_password" },
    });

    // Send welcome email if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "House of Lotus <hello@houseoflotus.ca>",
          to: email,
          subject: "Welcome to House of Lotus Canada",
          html: `
            <div style="font-family: Georgia, serif; color: #151513; background: #f2eee5; padding: 40px;">
              <p style="color: #c99743; font-size: 24px;">♢</p>
              <h1 style="font-size: 20px; letter-spacing: 0.13em;">HOUSE OF LOTUS</h1>
              <p style="color: #756e62; font-size: 12px; letter-spacing: 0.42em; margin-bottom: 32px;">CANADA</p>
              <p style="font-size: 16px; line-height: 1.7; max-width: 480px;">
                Welcome, ${firstName}. Your wholesale buyer account has been created.
                Please verify your email address to get started.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://houseoflotus.ca"}/auth/sign-in"
                 style="display: inline-block; padding: 14px 24px; background: #c99743; color: #14110d; text-decoration: none; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; margin-top: 24px;">
                Sign in to your account
              </a>
              <p style="color: #756e62; font-size: 12px; margin-top: 40px;">
                Built in Canada. Rooted in India.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }
    }

    return NextResponse.json({
      id: userId,
      email,
      message: "Account created. Please check your email to verify.",
    });
  } catch (err) {
    console.error("Sign-up error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
