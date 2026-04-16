import { NutritionistTokenForm } from "@/components/nutritionist-token-form";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type NutritionistRow = {
  clinic_name: string;
};

type ClientRow = {
  user_id: string;
  nutritionist_user_id: string;
  created_at: string;
};

type ClientProfile = {
  id: string;
  username: string;
  full_name: string;
  email: string;
};

type TokenRow = {
  token: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
};

export default async function NutritionistPage() {
  const session = await requireRole("nutritionist");
  const admin = createAdminClient();

  const { data: nutritionistData } = await admin
    .from("nutritionists")
    .select("clinic_name")
    .eq("user_id", session.profile.id)
    .maybeSingle();

  const nutritionist = (nutritionistData ?? null) as NutritionistRow | null;

  const { data: clientRows } = await admin
    .from("clients")
    .select("user_id, nutritionist_user_id, created_at")
    .eq("nutritionist_user_id", session.profile.id)
    .order("created_at", { ascending: false })
    .returns<ClientRow[]>();

  const clientIds = (clientRows ?? []).map((client) => client.user_id);
  let profilesById = new Map<string, ClientProfile>();

  if (clientIds.length) {
    const { data: clientProfiles } = await admin
      .from("profiles")
      .select("id, username, full_name, email")
      .in("id", clientIds)
      .returns<ClientProfile[]>();

    profilesById = new Map((clientProfiles ?? []).map((profile) => [profile.id, profile]));
  }

  const { data: tokens } = await admin
    .from("access_tokens")
    .select("token, status, created_at, expires_at, used_at")
    .eq("token_type", "client_invite")
    .eq("created_by_user_id", session.profile.id)
    .order("created_at", { ascending: false })
    .limit(15)
    .returns<TokenRow[]>();

  const totalClients = clientRows?.length ?? 0;
  const availableTokens = tokens?.filter((token) => token.status === "available").length ?? 0;
  const usedTokens = tokens?.filter((token) => token.status === "used").length ?? 0;

  return (
    <main>
      <div className="container stack">
        <section className="card heroCard">
          <div className="heroGrid">
            <div className="stack">
              <span className="kicker">Nutricionista</span>
              <h1 className="title">Gestión de clientes y altas invitadas.</h1>
              <p className="subtitle">
                Bienvenido, {session.profile.full_name}. Clínica: {nutritionist?.clinic_name ?? "-"}.
                Desde este panel puedes emitir tokens de cliente y revisar la base actual de usuarios vinculados.
              </p>
            </div>
            <div className="heroPanel stack">
              <div className="panelHeader">
                <span className="badge secondary">Profesional</span>
                <LogoutButton />
              </div>
              <div className="infoList">
                <div className="infoItem"><strong>Usuario</strong><span>{session.profile.username}</span></div>
                <div className="infoItem"><strong>Email</strong><span>{session.profile.email}</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid cols-3">
          <div className="statCard">
            <p className="statLabel">Clientes asignados</p>
            <p className="statValue">{totalClients}</p>
            <p className="statHint">Total visible en el panel</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Tokens disponibles</p>
            <p className="statValue">{availableTokens}</p>
            <p className="statHint">Invitaciones listas para usar</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Tokens usados</p>
            <p className="statValue">{usedTokens}</p>
            <p className="statHint">Altas ya completadas</p>
          </div>
        </section>

        <NutritionistTokenForm />

        <section className="card">
          <div className="panelHeader" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="pageSectionTitle">Clientes asignados</h2>
              <p className="pageSectionSubtitle">
                Relación actual de clientes vinculados a tu perfil de nutricionista.
              </p>
            </div>
          </div>
          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Alta</th>
                </tr>
              </thead>
              <tbody>
                {(clientRows ?? []).map((client) => {
                  const profile = profilesById.get(client.user_id);
                  return (
                    <tr key={client.user_id}>
                      <td>{profile?.username ?? client.user_id}</td>
                      <td>{profile?.full_name ?? "-"}</td>
                      <td>{profile?.email ?? "-"}</td>
                      <td>{formatDate(client.created_at)}</td>
                    </tr>
                  );
                })}
                {!clientRows?.length && (
                  <tr>
                    <td colSpan={4}>Todavía no tienes clientes registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="panelHeader" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="pageSectionTitle">Últimos tokens de cliente</h2>
              <p className="pageSectionSubtitle">
                Histórico reciente de invitaciones emitidas desde este perfil profesional.
              </p>
            </div>
          </div>
          <div className="tableWrapper">
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
                {(tokens ?? []).map((token) => (
                  <tr key={token.token}>
                    <td>{token.token}</td>
                    <td>{token.status}</td>
                    <td>{formatDate(token.created_at)}</td>
                    <td>{formatDate(token.expires_at)}</td>
                    <td>{formatDate(token.used_at)}</td>
                  </tr>
                ))}
                {!tokens?.length && (
                  <tr>
                    <td colSpan={5}>Todavía no hay tokens generados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
