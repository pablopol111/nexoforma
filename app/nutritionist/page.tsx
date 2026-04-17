import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { NutritionistTokenForm } from "@/components/nutritionist-token-form";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function NutritionistPage() {
  const session = await requireRole("nutritionist");
  const admin = createAdminClient();
  const [{ data: clients }, { data: profileRows }, { data: dailyEntries }, { data: requests }, { data: nutritionist }] = await Promise.all([
    admin.from("clients").select("user_id, nutritionist_user_id, blocked_by_nutritionist_status, created_at").eq("nutritionist_user_id", session.profile.id),
    admin.from("profiles").select("id, username, full_name, email").eq("role", "client"),
    admin.from("daily_entries").select("client_user_id, entry_date, weight_kg, steps").order("entry_date", { ascending: false }),
    admin.from("measurement_requests").select("client_user_id, requested_at, weight_status, measurements_status").eq("nutritionist_user_id", session.profile.id),
    admin.from("nutritionists").select("client_token_quota_total").eq("user_id", session.profile.id).maybeSingle(),
  ]);

  const clientIds = new Set((clients ?? []).map((item: any) => item.user_id));
  const profiles = ((profileRows ?? []) as any[]).filter((row) => clientIds.has(row.id));
  const latestByClient = new Map<string, any>();
  for (const entry of (dailyEntries ?? []) as any[]) if (!latestByClient.has(entry.client_user_id)) latestByClient.set(entry.client_user_id, entry);
  const pendingRequests = ((requests ?? []) as any[]).filter((item) => item.weight_status === "pending" || item.measurements_status === "pending");

  return (
    <DashboardShell role="nutritionist" activeHref="/nutritionist" pageTitle="Dashboard" pageDescription="Valor agregado sobre tus clientes y accesos rápidos." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <div className="statsGrid">
        <article className="statCard"><span>Clientes</span><strong>{clients?.length ?? 0}</strong></article>
        <article className="statCard"><span>Solicitudes pendientes</span><strong>{pendingRequests.length}</strong></article>
        <article className="statCard"><span>Cupo total</span><strong>{(nutritionist as any)?.client_token_quota_total ?? 0}</strong></article>
      </div>
      <NutritionistTokenForm />
      <section className="panel stack">
        <div className="panelHead"><h2>Perfiles</h2></div>
        <div className="listGrid">
          {profiles.map((profile: any) => {
            const latest = latestByClient.get(profile.id);
            return (
              <Link className="listCard linkBlock" key={profile.id} href={`/nutritionist/clients/${profile.id}`}>
                <strong>{profile.full_name}</strong>
                <span>@{profile.username}</span>
                <span>{profile.email}</span>
                <span>{latest ? `Último peso ${formatNumber(latest.weight_kg,2)} kg · ${formatDate(latest.entry_date)}` : "Sin registros"}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
