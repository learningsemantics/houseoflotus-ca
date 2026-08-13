import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseUser = await requireAuth();

    const membership = await db.organizationMember.findFirst({
      where: {
        userId: supabaseUser.id,
        organization: { status: "APPROVED" },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "No approved organization found" }, { status: 404 });
    }

    // Fetch all members
    const members = await db.organizationMember.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });

    // Fetch pending invitations
    const invitations = await db.invitation.findMany({
      where: {
        organizationId: membership.organizationId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        role: m.role,
        isPrimary: m.isPrimary,
        joinedAt: m.joinedAt,
      })),
      invitations: invitations.map((i) => ({
        id: i.id,
        email: i.invitedEmail,
        role: i.role,
        invitedByName: `${(i as unknown as { invitedBy: { firstName: string; lastName: string } }).invitedBy.firstName} ${(i as unknown as { invitedBy: { firstName: string; lastName: string } }).invitedBy.lastName}`,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
      })),
      currentUserId: supabaseUser.id,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Team GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
