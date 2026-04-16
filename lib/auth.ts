import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ROLE_DASHBOARD } from "@/lib/constants";
import type { ProfileRecord, UserRole } from "@/lib/types";

export async function getCurrentUserWithProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, username, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (data ?? null) as ProfileRecord | null;

  if (!profile) {
    return null;
  }

  return { user, profile };
}

export async function requireRole(role: UserRole) {
  const session = await getCurrentUserWithProfile();

  if (!session) {
    redirect("/login");
  }

  if (session.profile.role !== role) {
    redirect(ROLE_DASHBOARD[session.profile.role] ?? "/");
  }

  return session;
}

export async function requireSession() {
  const session = await getCurrentUserWithProfile();

  if (!session) {
    redirect("/login");
  }

  return session;
}