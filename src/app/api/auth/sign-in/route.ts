import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { signInSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Use Supabase REST API for sign in
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const { data, error } = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());

    if (error) {
      const message = error.message || error.msg || "Invalid email or password";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Upsert User record in Prisma (in case they don't exist yet from legacy data)
    await db.user.upsert({
      where: { supabaseUid: user.id },
      create: {
        supabaseUid: user.id,
        email: user.email ?? email,
        firstName: user.user_metadata?.first_name || "Unknown",
        lastName: user.user_metadata?.last_name || "Unknown",
      },
      update: {
        email: user.email ?? email,
      },
    });

    // Update lastLoginAt (we use updatedAt as proxy since we don't have that field)
    // The updatedAt will be auto-updated by the upsert above

    // Fetch organization membership info
    const membership = await db.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: { select: { id: true, status: true, legalName: true } } },
      orderBy: { joinedAt: "desc" },
    });

    // Log audit event
    await logAudit({
      action: "USER_SIGN_IN",
      actorUserId: user.id,
      organizationId: membership?.organizationId,
      metadata: { email, method: "email_password" },
    });

    // Return session tokens and user data with org info
    // The client-side will handle setting cookies via the browser supabase client
    // Instead, we pass the tokens back so the client can set the session
    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: {
        id: user.id,
        email: user.email,
      },
      organization: membership
        ? {
            id: membership.organization.id,
            status: membership.organization.status,
            name: membership.organization.legalName,
            role: membership.role,
          }
        : null,
    });
  } catch (err) {
    console.error("Sign-in error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
