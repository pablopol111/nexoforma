import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { NutritionistTokenForm } from "@/components/nutritionist-token-form";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatNumber } from "@/lib/utils";

type ClientRow = { user_id: string; nutritionist_user_id: string; blocked_by_nutritionist_status: boolean; created_at: string };
type ProfileRow = { id: string; username: string; full_name: string; email: string };
type DailyEntryRow = { client_user_id: string; entry_date: string; weight_kg: number; steps: number };
type RequestRow = { client_user_id: string; requested_at: string; weight_status: string; measurements_status: string };
type TokenRow = {
  id: string;
  token: string;
  status: "available" | "used" | "revoked";
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
  assigned_to_client: string | null;
};

export default async function NutritionistPage() {
  const session = await requireRole("nutritionist");
  const admin = createAdminClient();
  const [{ data: clients }, { data: profileRows }, { data: dailyEntries }, { data: requests }, { data: nutritionist }, { data: tokenRows }] = await Promise.all([
    admin.from("clients").select("user_id, nutritionist_user_id, blocked_by_nutritionist_status, created_at").eq("nutritionist_user_id", session.profile.id),
    admin.from("profiles").select("id, username, full_name, email").eq("role", "client"),
    admin.from("daily_entries").select("client_user_id, entry_date, weight_kg, steps").order("entry_date", { ascending: false }),
    admin.from("measurement_requests").select("client_user_id, requested_at, weight_status, measurements_status").eq("nutritionist_user_id", session.profile.id),
    admin.from("nutritionists").select("client_token_quota_total").eq("user_id", session.profile.id).maybeSingle(),
    admin
      .from("access_tokens")
      .select("id, token, status, expires_at, used_at, created_at, assigned_to_client")
      .eq("token_type", "client_invite")
      .eq("created_by_user_id", session.profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const clientsList = (clients ?? []) as ClientRow[];
  const clientIds = new Set(clientsList.map((item) => item.user_id));
  const profiles = ((profileRows ?? []) as ProfileRow[]).filter((row) => clientIds.has(row.id));
  const latestByClient = new Map<string, DailyEntryRow>();
  for (const entry of (dailyEntries ?? []) as DailyEntryRow[]) if (!latestByClient.has(entry.client_user_id)) latestByClient.set(entry.client_user_id, entry);
  const pendingRequests = ((requests ?? []) as RequestRow[]).filter((item) => item.weight_status === "pending" || item.measurements_status === "pending");
  const tokens = (tokenRows ?? []) as TokenRow[];
  const quotaTotal = (nutritionist as { client_token_quota_total?: number } | null)?.client_token_quota_total ?? 0;
  const availableTokens = tokens.filter((item) => item.status === "available");
  const usedTokens = tokens.filter((item) => item.status === "used");
  const reservedSlots = clientsList.length + availableTokens.length;
  const remainingCapacity = Math.max(0, quotaTotal - reservedSlots);

  return (
    <DashboardShell role="nutritionist" activeHref="/nutritionist" pageTitle="Dashboard" pageDescription="Valor agregado sobre tus clientes y accesos rápidos." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <div className="statsGrid">
        <article className="statCard"><span>Clientes activos</span><strong>{clientsList.length}</strong></article>
        <article className="statCard"><span>Solicitudes pendientes</span><strong>{pendingRequests.length}</strong></article>
        <article className="statCard"><span>Plazas libres</span><strong>{remainingCapacity}</strong></article>
        <article className="statCard"><span>Tokens pendientes</span><strong>{availableTokens.length}</strong></article>
      </div>

      <div className="columns tokenHistoryLayout alignStart">
        <NutritionistTokenForm remainingCapacity={remainingCapacity} />
        <section className="panel stack">
          <div className="panelHead split wrapOnMobile">
            <h2>Histórico de tokens</h2>
            <span className="chip">{tokens.length} total</span>
          </div>
          {tokens.length ? (
            <div className="tableWrap tokenHistoryWrap">
              <table>
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>Caduca</th>
                    <th>Usado</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <td><code className="tableCode">{token.token}</code></td>
                      <td>
                        <span className={`statusPill ${token.status}`}>
                          {token.status === "available" ? "Disponible" : token.status === "used" ? "Usado" : "Revocado"}
                        </span>
                      </td>
                      <td>{formatDate(token.created_at)}</td>
                      <td>{formatDate(token.expires_at)}</td>
                      <td>{formatDate(token.used_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="emptyBox">Todavía no has generado tokens de cliente.</div>
          )}
        </section>
      </div>

      <section className="panel stack">
        <div className="panelHead"><h2>Perfiles</h2></div>
        <div className="listGrid">
          {profiles.map((profile) => {
            const latest = latestByClient.get(profile.id);
            return (
              <Link className="listCard linkBlock" key={profile.id} href={`/nutritionist/clients/${profile.id}`}>
                <strong>{profile.full_name}</strong>
                <span>@{profile.username}</span>
                <span>{profile.email}</span>
                <span>{latest ? `Último peso ${formatNumber(latest.weight_kg, 2)} kg · ${formatDate(latest.entry_date)}` : "Sin registros"}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
