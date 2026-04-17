import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ROLE_DASHBOARD } from "@/lib/constants";
import type { ProfileRecord, UserRole } from "@/lib/types";

export async function getCurrentUserWithProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, username, email, full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (data ?? null) as ProfileRecord | null;
  if (!profile) return null;
  return { user, profile };
}

export async function requireRole(role: UserRole) {
  const session = await getCurrentUserWithProfile();
  if (!session) redirect("/login");
  if (session.profile.status !== "active") redirect("/login");
  if (session.profile.role !== role) redirect(ROLE_DASHBOARD[session.profile.role] ?? "/");
  if (role === "client") {
    const admin = createAdminClient();
    const { data } = await admin.from("clients").select("blocked_by_nutritionist_status").eq("user_id", session.profile.id).maybeSingle();
    if ((data as { blocked_by_nutritionist_status?: boolean } | null)?.blocked_by_nutritionist_status) redirect("/login");
  }
  return session;
}
