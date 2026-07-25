import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component — can't set cookies
          }
        },
      },
    },
  )
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) throw new AuthError("UNAUTHORIZED", "Authentication required")
  return user
}

export class AuthError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST"
  constructor(code: AuthError["code"], message: string) {
    super(message)
    this.name = "AuthError"
    this.code = code
  }
}
