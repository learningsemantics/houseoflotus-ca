import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { sendTeamInvitationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await requireRole("BUYER_ADMIN");
    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!role || (role !== "BUYER_ADMIN" && role !== "BUYER_MEMBER")) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const existingMember = await db.organizationMember.findFirst({
        where: {
          userId: existingUser.id,
          organizationId: organization.id,
        },
      });
      if (existingMember) {
        return NextResponse.json({ error: "This person is already a team member" }, { status: 409 });
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        organizationId: organization.id,
        invitedEmail: normalizedEmail,
        status: "PENDING",
      },
    });
    if (existingInvitation) {
      return NextResponse.json({ error: "An invitation is already pending for this email" }, { status: 409 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const inviter = await db.user.findUnique({ where: { id: user.id } });

    await db.invitation.create({
      data: {
        organizationId: organization.id,
        invitedEmail: normalizedEmail,
        invitedByUserId: user.id,
        role,
        token,
        expiresAt,
      },
    });

    // Send invitation email
    await sendTeamInvitationEmail(
      normalizedEmail,
      inviter ? `${inviter.firstName} ${inviter.lastName}` : "Team Admin",
      organization.legalName,
      token
    );

    await logAudit({
      action: "MEMBER_INVITED",
      actorUserId: user.id,
      organizationId: organization.id,
      metadata: { email: normalizedEmail, role },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
        return NextResponse.json({ error: code === "UNAUTHORIZED" ? "Unauthorized" : "Insufficient permissions" }, { status: code === "UNAUTHORIZED" ? 401 : 403 });
      }
    }
    console.error("Team invite POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
