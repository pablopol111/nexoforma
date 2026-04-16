import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { NutritionistTokenForm } from "@/components/nutritionist-token-form";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type ClientRow = {
  user_id: string;
  nutritionist_user_id: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  email: string;
};

type ClientProfileRow = {
  client_user_id: string;
  updated_at: string;
};

type TokenRow = {
  token: string;
  status: string;
  created_at: string;
  expires_at: string | null;
};

export default async function NutritionistPage() {
  const session = await requireRole("nutritionist");
  const admin = createAdminClient();

  const { data: clients } = await admin
    .from("clients")
    .select("user_id, nutritionist_user_id, created_at")
    .eq("nutritionist_user_id", session.profile.id)
    .order("created_at", { ascending: false })
    .returns<ClientRow[]>();

  const clientIds = (clients ?? []).map((item) => item.user_id);

  const { data: profiles } = clientIds.length
    ? await admin.from("profiles").select("id, username, full_name, email").in("id", clientIds).returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const { data: clientProfiles } = clientIds.length
    ? await admin.from("client_profiles").select("client_user_id, updated_at").in("client_user_id", clientIds).returns<ClientProfileRow[]>()
    : { data: [] as ClientProfileRow[] };

  const { data: tokens } = await admin
    .from("access_tokens")
    .select("token, status, created_at, expires_at")
    .eq("token_type", "client_invite")
    .eq("created_by_user_id", session.profile.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<TokenRow[]>();

  const profilesById = new Map((profiles ?? []).map((item) => [item.id, item]));
  const clientProfileById = new Map((clientProfiles ?? []).map((item) => [item.client_user_id, item]));

  return (
    <DashboardShell
      role="nutritionist"
      activeHref="/nutritionist"
      pageTitle="Clientes"
      pageDescription="Seguimiento en lectura y accesos para nuevas altas."
      profileName={session.profile.full_name}
      profileSubtext={session.profile.email}
    >
      <div className="statsGrid">
        <article className="statCard"><span>Clientes</span><strong>{clients?.length ?? 0}</strong></article>
        <article className="statCard"><span>Tokens disponibles</span><strong>{tokens?.filter((item) => item.status === "available").length ?? 0}</strong></article>
        <article className="statCard"><span>Tokens usados</span><strong>{tokens?.filter((item) => item.status === "used").length ?? 0}</strong></article>
      </div>
      <NutritionistTokenForm />
      <section className="panel stack">
        <div className="panelHead"><h2>Perfiles</h2></div>
        <div className="listGrid">
          {(clients ?? []).map((item) => {
            const profile = profilesById.get(item.user_id);
            const saved = clientProfileById.get(item.user_id);
            return (
              <Link className="listCard linkBlock" key={item.user_id} href={`/nutritionist/clients/${item.user_id}`}>
                <strong>{profile?.full_name ?? item.user_id}</strong>
                <span>@{profile?.username ?? "-"}</span>
                <span>{profile?.email ?? "-"}</span>
                <span>{saved ? `Perfil actualizado ${formatDate(saved.updated_at)}` : "Perfil pendiente"}</span>
              </Link>
            );
          })}
          {!clients?.length ? <div className="emptyBox">Aún no hay clientes.</div> : null}
        </div>
      </section>
      <section className="panel stack">
        <div className="panelHead"><h2>Tokens</h2></div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Token</th><th>Estado</th><th>Creado</th><th>Caduca</th></tr>
            </thead>
            <tbody>
              {(tokens ?? []).map((item) => (
                <tr key={item.token}>
                  <td>{item.token}</td>
                  <td>{item.status}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{formatDate(item.expires_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}