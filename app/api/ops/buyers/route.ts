import { NextRequest, NextResponse } from "next/server"
import { requireOpsAdmin } from "@/lib/ops-auth"
import { db } from "@/lib/db"
import { OrganizationStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireOpsAdmin()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (status && status !== "ALL") where.status = status as OrganizationStatus
    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ]
    }

    const orgs = await db.organization.findMany({
      where,
      include: {
        createdBy: { select: { email: true, firstName: true, lastName: true } },
        buyerProfile: { select: { roastingCapacityKgMonth: true, annualGreenCoffeeKg: true } },
        _count: { select: { members: true } },
      },
      orderBy: { submittedAt: { sort: "desc", nulls: "last" } },
      take: 100,
    })

    return NextResponse.json({ buyers: orgs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : err.code === "FORBIDDEN" ? 403 : 500 })
  }
}
