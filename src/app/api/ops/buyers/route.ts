import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { OrgStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await requireOpsAdmin();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      where.status = status as OrgStatus;
    }

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: "insensitive" } },
        { operatingName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { province: { contains: search, mode: "insensitive" } },
      ];
    }

    const organizations = await db.organization.findMany({
      where,
      include: {
        members: {
          include: { user: true },
          orderBy: { isPrimary: "desc" },
        },
        buyerProfile: true,
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ buyers: organizations, opsUserId: user.id });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("Buyers list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
