import { db } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { headers } from "next/headers";

interface LogAuditParams {
  action: AuditAction;
  actorUserId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit({
  action,
  actorUserId,
  organizationId,
  metadata,
}: LogAuditParams) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? null;
  const ua = headersList.get("user-agent") ?? null;

  await db.auditEvent.create({
    data: {
      action,
      actorUserId,
      organizationId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress: ip,
      userAgent: ua,
    },
  });
}
