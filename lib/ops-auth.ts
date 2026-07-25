import { requireAuth, AuthError } from "@/lib/supabase/server"
import { db } from "@/lib/db"

export async function requireOpsAdmin() {
  const user = await requireAuth()
  const dbUser = await db.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !dbUser.isInternal) {
    throw new AuthError("FORBIDDEN", "Internal access required")
  }
  if (dbUser.globalRole !== "OPS_ADMIN" && dbUser.globalRole !== "SUPER_ADMIN") {
    throw new AuthError("FORBIDDEN", "Ops admin or super admin required")
  }
  return { ...user, dbUser }
}

export async function requireSuperAdmin() {
  const user = await requireAuth()
  const dbUser = await db.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !dbUser.isInternal || dbUser.globalRole !== "SUPER_ADMIN") {
    throw new AuthError("FORBIDDEN", "Super admin required")
  }
  return { ...user, dbUser }
}