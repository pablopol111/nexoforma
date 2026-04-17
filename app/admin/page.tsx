import { AdminTokenForm } from "@/components/admin-token-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminPage() {
  const session = await requireRole("admin");
  const admin = createAdminClient();
  const [{ data: tokens }, { data: nutritionists }, { data: profiles }, { data: clients }] = await Promise.all([
    admin.from("access_tokens").select("token, status, created_at, expires_at, used_at").eq("token_type", "nutritionist_invite").order("created_at", { ascending: false }).limit(20),
    admin.from("nutritionists").select("user_id, alias, clinic_name, client_token_quota_total, created_at"),
    admin.from("profiles").select("id, username, full_name, email, status").in("role", ["nutritionist"]),
    admin.from("clients").select("nutritionist_user_id, blocked_by_nutritionist_status"),
  ]);
  const profileMap = new Map(((profiles ?? []) as any[]).map((item) => [item.id, item]));
  const clientsByNutri = new Map<string, number>();
  for (const item of (clients ?? []) as any[]) clientsByNutri.set(item.nutritionist_user_id, (clientsByNutri.get(item.nutritionist_user_id) ?? 0) + 1);

  return (
    <DashboardShell role="admin" activeHref="/admin" pageTitle="Administración" pageDescription="Control de nutricionistas, estados y tokens." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <div className="statsGrid">
        <article className="statCard"><span>Nutricionistas</span><strong>{nutritionists?.length ?? 0}</strong></article>
        <article className="statCard"><span>Tokens disponibles</span><strong>{(tokens ?? []).filter((item: any) => item.status === "available").length}</strong></article>
        <article className="statCard"><span>Tokens usados</span><strong>{(tokens ?? []).filter((item: any) => item.status === "used").length}</strong></article>
      </div>
      <AdminTokenForm />
      <section className="panel stack">
        <div className="panelHead"><h2>Nutricionistas</h2></div>
        <div className="listGrid">{((nutritionists ?? []) as any[]).map((item) => { const profile = profileMap.get(item.user_id); return <article key={item.user_id} className="listCard"><strong>{profile?.full_name ?? item.alias ?? item.user_id}</strong><span>@{profile?.username ?? "pendiente"}</span><span>{item.clinic_name ?? "Sin clínica"}</span><span>Estado: {profile?.status ?? "pending"}</span><span>Clientes: {clientsByNutri.get(item.user_id) ?? 0}</span><span>Cupo total: {item.client_token_quota_total}</span><span>Alta: {formatDate(item.created_at)}</span></article>; })}</div>
      </section>
      <section className="panel stack">
        <div className="panelHead"><h2>Tokens de nutricionista</h2></div>
        <div className="tableWrap"><table><thead><tr><th>Token</th><th>Estado</th><th>Creado</th><th>Caduca</th><th>Usado</th></tr></thead><tbody>{((tokens ?? []) as any[]).map((item) => <tr key={item.token}><td>{item.token}</td><td>{item.status}</td><td>{formatDate(item.created_at)}</td><td>{formatDate(item.expires_at)}</td><td>{formatDate(item.used_at)}</td></tr>)}</tbody></table></div>
      </section>
    </DashboardShell>
  );
}
