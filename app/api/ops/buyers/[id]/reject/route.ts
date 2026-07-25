import { NextRequest, NextResponse } from "next/server"
import { requireOpsAdmin } from "@/lib/ops-auth"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireOpsAdmin()
    const { id } = await params
    const { reason } = await req.json()
    const org = await db.organization.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewedByUserId: user.id, rejectionReason: reason },
    })
    await logAudit({ action: "ORGANIZATION_REJECTED", actorUserId: user.id, targetType: "organization", targetId: id, details: { reason }, req })
    return NextResponse.json({ organization: org })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : err.code === "FORBIDDEN" ? 403 : 500 })
  }
}