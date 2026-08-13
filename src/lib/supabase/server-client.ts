import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can fail in Server Components (read-only cookies).
            // This is safe to ignore for auth session refresh in RSC.
          }
        },
      },
    }
  );
};

export const getServerSession = async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const getServerUser = async () => {
  const session = await getServerSession();
  return session?.user ?? null;
};

export const requireAuth = async () => {
  const user = await getServerUser();
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "Authentication required");
  }
  return user;
};

export const requireRole = async (...roles: string[]) => {
  // 1. Get the Supabase auth user
  const supabaseUser = await requireAuth();

  // 2. Look up the internal Prisma User by supabaseUid
  const prismaUser = await db.user.findUnique({
    where: { supabaseUid: supabaseUser.id },
  });

  if (!prismaUser) {
    throw new AuthError("FORBIDDEN", "User record not found in database");
  }

  // 3. Find the user's approved organization membership
  const membership = await db.organizationMember.findFirst({
    where: {
      userId: prismaUser.id,
      organization: { status: "APPROVED" },
    },
    include: { organization: true },
  });

  if (!membership) {
    throw new AuthError("FORBIDDEN", "No approved organization membership");
  }

  if (!roles.includes(membership.role)) {
    throw new AuthError("FORBIDDEN", "Insufficient role");
  }

  return {
    user: prismaUser,
    supabaseUser,
    membership,
    organization: membership.organization,
  };
};

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}
