import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ user: null });
    }

    const supabaseUser = session.user;

    // Fetch User from Prisma with organization membership
    const user = await db.user.findUnique({
      where: { supabaseUid: supabaseUser.id },
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                status: true,
                legalName: true,
                operatingName: true,
              },
            },
          },
          orderBy: { joinedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Return user data with org info
    const membership = user.memberships[0];
    const organization = membership
      ? {
          id: membership.organization.id,
          status: membership.organization.status,
          name: membership.organization.legalName,
          operatingName: membership.organization.operatingName,
          role: membership.role,
        }
      : null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        organization,
      },
    });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ user: null });
  }
}
