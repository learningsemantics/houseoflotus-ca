import { db } from "@/lib/db"
import { AuditAction } from "@prisma/client"

type LogAuditParams = {
  action: AuditAction
  actorUserId?: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  req?: Request
}

export async function logAudit({ action, actorUserId, targetType, targetId, details, req }: LogAuditParams) {
  const ip = req?.headers.get("x-forwarded-for") ?? req?.headers.get("x-real-ip") ?? null
  const userAgent = req?.headers.get("user-agent") ?? null
  await db.auditEvent.create({
    data: {
      action,
      actorUserId: actorUserId ?? null,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      details: details ? JSON.stringify(details) : null,
      ip,
      userAgent,
    },
  })
}