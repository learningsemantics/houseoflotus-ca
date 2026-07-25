import { NextRequest, NextResponse } from "next/server"
import { requireOpsAdmin } from "@/lib/ops-auth"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireOpsAdmin()
    const { id } = await params
    const { message } = await req.json()
    const org = await db.organization.update({
      where: { id },
      data: { status: "NEEDS_INFORMATION", reviewedAt: new Date(), reviewedByUserId: user.id, rejectionReason: message },
    })
    await logAudit({ action: "ORGANIZATION_NEEDS_INFO", actorUserId: user.id, targetType: "organization", targetId: id, details: { message }, req })
    return NextResponse.json({ organization: org })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : err.code === "FORBIDDEN" ? 403 : 500 })
  }
}