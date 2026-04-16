import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv, getSupabaseServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_DASHBOARD } from "@/lib/constants";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/nutritionist") ||
    pathname.startsWith("/client")
  );
}

function isAuthScreen(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/register/");
}

function getDefaultDashboard(role: string | null | undefined) {
  return ROLE_DASHBOARD[role ?? ""] ?? "/";
}

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicEnv();
  getSupabaseServerEnv();

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { claims },
  } = await supabase.auth.getClaims();

  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const pathname = request.nextUrl.pathname;

  if (!userId) {
    if (isProtectedPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const profile = (data ?? null) as { role: string } | null;

  if (!profile?.role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthScreen(pathname)) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = getDefaultDashboard(profile.role);
    targetUrl.search = "";
    return NextResponse.redirect(targetUrl);
  }

  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = getDefaultDashboard(profile.role);
    targetUrl.search = "";
    return NextResponse.redirect(targetUrl);
  }

  if (pathname.startsWith("/nutritionist") && profile.role !== "nutritionist") {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = getDefaultDashboard(profile.role);
    targetUrl.search = "";
    return NextResponse.redirect(targetUrl);
  }

  if (pathname.startsWith("/client") && profile.role !== "client") {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = getDefaultDashboard(profile.role);
    targetUrl.search = "";
    return NextResponse.redirect(targetUrl);
  }

  return response;
}
