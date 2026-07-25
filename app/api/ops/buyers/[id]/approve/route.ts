import { NextRequest, NextResponse } from "next/server"
import { requireOpsAdmin } from "@/lib/ops-auth"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireOpsAdmin()
    const { id } = await params
    const org = await db.organization.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedByUserId: user.id },
    })
    await logAudit({ action: "ORGANIZATION_APPROVED", actorUserId: user.id, targetType: "organization", targetId: id, req })
    return NextResponse.json({ organization: org })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : err.code === "FORBIDDEN" ? 403 : 500 })
  }
}
