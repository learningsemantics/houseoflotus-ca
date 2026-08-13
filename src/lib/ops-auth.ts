import { requireAuth, AuthError } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function requireOpsAdmin() {
  const supabaseUser = await requireAuth();

  const user = await db.user.findUnique({
    where: { supabaseUid: supabaseUser.id },
  });

  if (!user) {
    throw new AuthError("UNAUTHORIZED", "User not found in database");
  }

  if (!user.isInternal) {
    throw new AuthError("FORBIDDEN", "Internal access required");
  }

  if (!user.globalRole || !['OPS_ADMIN', 'SUPER_ADMIN'].includes(user.globalRole)) {
    throw new AuthError("FORBIDDEN", "Insufficient role for operations admin");
  }

  return user;
}
