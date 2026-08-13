import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const { data, error } = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          auth_code: code,
          redirect_url: `${origin}/auth/callback`,
        }),
      }
    ).then((r) => r.json());

    if (!error && data?.access_token && data?.refresh_token) {
      // Set the session cookies
      const response = NextResponse.redirect(`${origin}${next}`);

      // Set access token cookie
      response.cookies.set("sb-access-token", data.access_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
      });

      // Set refresh token cookie
      response.cookies.set("sb-refresh-token", data.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    if (error) {
      console.error("Auth callback error:", error);
    }
  }

  // If no code or error, redirect to sign-in
  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
