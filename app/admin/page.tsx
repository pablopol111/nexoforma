import { AdminTokenForm } from "@/components/admin-token-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type TokenRow = {
  token: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
};

type NutritionistRow = {
  user_id: string;
  clinic_name: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  email: string;
};

export default async function AdminPage() {
  const session = await requireRole("admin");
  const admin = createAdminClient();

  const { data: tokens } = await admin
    .from("access_tokens")
    .select("token, status, created_at, expires_at, used_at")
    .eq("token_type", "nutritionist_invite")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<TokenRow[]>();

  const { data: nutritionists } = await admin
    .from("nutritionists")
    .select("user_id, clinic_name, created_at")
    .order("created_at", { ascending: false })
    .returns<NutritionistRow[]>();

  const profileIds = (nutritionists ?? []).map((item) => item.user_id);
  const { data: profiles } = profileIds.length
    ? await admin.from("profiles").select("id, username, full_name, email").in("id", profileIds).returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const profilesById = new Map((profiles ?? []).map((item) => [item.id, item]));

  return (
    <DashboardShell
      role="admin"
      activeHref="/admin"
      pageTitle="Administración"
      pageDescription="Control de accesos y altas profesionales."
      profileName={session.profile.full_name}
      profileSubtext={session.profile.email}
    >
      <div className="statsGrid">
        <article className="statCard"><span>Nutricionistas</span><strong>{nutritionists?.length ?? 0}</strong></article>
        <article className="statCard"><span>Tokens disponibles</span><strong>{tokens?.filter((item) => item.status === "available").length ?? 0}</strong></article>
        <article className="statCard"><span>Tokens usados</span><strong>{tokens?.filter((item) => item.status === "used").length ?? 0}</strong></article>
      </div>
      <AdminTokenForm />
      <section className="panel stack">
        <div className="panelHead"><h2>Nutricionistas</h2></div>
        <div className="listGrid">
          {(nutritionists ?? []).map((item) => {
            const profile = profilesById.get(item.user_id);
            return (
              <article className="listCard" key={item.user_id}>
                <strong>{profile?.full_name ?? item.user_id}</strong>
                <span>@{profile?.username ?? "-"}</span>
                <span>{profile?.email ?? "-"}</span>
                <span>{item.clinic_name}</span>
                <span>{formatDate(item.created_at)}</span>
              </article>
            );
          })}
        </div>
      </section>
      <section className="panel stack">
        <div className="panelHead"><h2>Tokens</h2></div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Token</th><th>Estado</th><th>Creado</th><th>Caduca</th><th>Usado</th></tr>
            </thead>
            <tbody>
              {(tokens ?? []).map((item) => (
                <tr key={item.token}>
                  <td>{item.token}</td>
                  <td>{item.status}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{formatDate(item.expires_at)}</td>
                  <td>{formatDate(item.used_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}