import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_DASHBOARD } from "@/lib/constants";
import { getSupabasePublicEnv, getSupabaseServerEnv } from "@/lib/env";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/nutritionist") || pathname.startsWith("/client");
}

function isAuthScreen(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

function getDashboard(role: string | null | undefined) {
  return ROLE_DASHBOARD[role ?? ""] ?? "/";
}

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicEnv();
  getSupabaseServerEnv();
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  if (!user) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role, status").eq("id", user.id).maybeSingle();
  const profile = (data ?? null) as { role: string; status: string } | null;

  if (!profile || profile.status !== "active") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (profile.role === "client") {
    const { data: client } = await admin.from("clients").select("blocked_by_nutritionist_status").eq("user_id", user.id).maybeSingle();
    if ((client as { blocked_by_nutritionist_status?: boolean } | null)?.blocked_by_nutritionist_status) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (isAuthScreen(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = getDashboard(profile.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = getDashboard(profile.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/nutritionist") && profile.role !== "nutritionist") {
    const url = request.nextUrl.clone();
    url.pathname = getDashboard(profile.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/client") && profile.role !== "client") {
    const url = request.nextUrl.clone();
    url.pathname = getDashboard(profile.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
