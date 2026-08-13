import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect to sign-in if not authenticated
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth/sign-in") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname.startsWith("/auth/forgot-password") ||
    request.nextUrl.pathname.startsWith("/auth/reset-password") ||
    request.nextUrl.pathname.startsWith("/auth/callback");

  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    isAuthPage;

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isAuthPage && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
