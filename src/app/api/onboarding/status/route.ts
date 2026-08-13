import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseUser = await requireAuth();

    // Find the user's organization membership
    const membership = await db.organizationMember.findFirst({
      where: { userId: supabaseUser.id },
      include: {
        organization: {
          select: {
            id: true,
            legalName: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            rejectionReason: true,
            infoRequestNotes: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    if (!membership) {
      return NextResponse.json({
        status: "NO_APPLICATION",
        message: "No application found",
        hasApplication: false,
      });
    }

    const org = membership.organization;

    return NextResponse.json({
      status: org.status,
      hasApplication: true,
      organization: {
        id: org.id,
        legalName: org.legalName,
        status: org.status,
        submittedAt: org.submittedAt,
        reviewedAt: org.reviewedAt,
        rejectionReason: org.rejectionReason,
        infoRequestNotes: org.infoRequestNotes,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    console.error("Onboarding status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
