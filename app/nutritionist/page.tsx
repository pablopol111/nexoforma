import { DashboardShell } from "@/components/dashboard-shell";
import { NutritionistTokenForm } from "@/components/nutritionist-token-form";
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

type EntryRow = {
  client_user_id: string;
  recorded_at: string;
};

function getStatusClass(status: string) {
  return status === "used" ? "used" : status === "revoked" ? "revoked" : "available";
}

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

  const clientIds = (clientRows ?? []).map((client: ClientRow) => client.user_id);
  let profilesById = new Map<string, ClientProfile>();
  let latestEntriesByClient = new Map<string, string>();

  if (clientIds.length) {
    const { data: clientProfiles } = await admin
      .from("profiles")
      .select("id, username, full_name, email")
      .in("id", clientIds)
      .returns<ClientProfile[]>();

    profilesById = new Map((clientProfiles ?? []).map((profile: ClientProfile) => [profile.id, profile]));

    const { data: entryRows } = await admin
      .from("entries")
      .select("client_user_id, recorded_at")
      .in("client_user_id", clientIds)
      .order("recorded_at", { ascending: false })
      .returns<EntryRow[]>();

    latestEntriesByClient = new Map();
    (entryRows ?? []).forEach((entry: EntryRow) => {
      if (!latestEntriesByClient.has(entry.client_user_id)) {
        latestEntriesByClient.set(entry.client_user_id, entry.recorded_at);
      }
    });
  }

  const { data: tokens } = await admin
    .from("access_tokens")
    .select("token, status, created_at, expires_at, used_at")
    .eq("token_type", "client_invite")
    .eq("created_by_user_id", session.profile.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<TokenRow[]>();

  const totalClients = clientRows?.length ?? 0;
  const availableTokens = tokens?.filter((token: TokenRow) => token.status === "available").length ?? 0;
  const usedTokens = tokens?.filter((token: TokenRow) => token.status === "used").length ?? 0;
  const recentFollowUps = latestEntriesByClient.size;

  return (
    <DashboardShell
      role="nutritionist"
      activeHref="/nutritionist"
      workspaceLabel={`Clínica | ${nutritionist?.clinic_name ?? "Sin clínica"}`}
      pageTitle="Seguimiento profesional y altas de cliente"
      pageDescription="Un panel más cercano a una herramienta diaria: visión rápida de cartera, invitaciones activas y lectura ordenada de cada cliente."
      profileName={session.profile.full_name}
      profileSubtext={`${session.profile.username} · ${session.profile.email}`}
      topBadges={<span className="roleChip">Nutricionista</span>}
      heroMetrics={
        <>
          <div className="panelHeader">
            <div>
              <span className="kicker">Visión de cartera</span>
              <h2 className="title compact">Seguimiento en una sola pantalla</h2>
              <p className="subtitle">La estructura se inspira en dashboards con navegación lateral y bloques muy legibles, adaptados aquí al flujo de nutrición.</p>
            </div>
          </div>
          <div className="heroStats">
            <div className="heroMiniCard">
              <p className="statLabel">Clientes</p>
              <p className="statValue">{totalClients}</p>
              <p className="statHint">Base vinculada</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Invitaciones listas</p>
              <p className="statValue">{availableTokens}</p>
              <p className="statHint">Pendientes de registro</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Invitaciones usadas</p>
              <p className="statValue">{usedTokens}</p>
              <p className="statHint">Altas completadas</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Seguimientos</p>
              <p className="statValue">{recentFollowUps}</p>
              <p className="statHint">Clientes con entradas</p>
            </div>
          </div>
        </>
      }
    >
      <div className="grid cols-4">
        <article className="statCard">
          <p className="statLabel">Clínica</p>
          <p className="statValue" style={{ fontSize: "1.8rem" }}>{nutritionist?.clinic_name ?? "-"}</p>
          <p className="statHint">Centro activo del profesional.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Clientes</p>
          <p className="statValue">{totalClients}</p>
          <p className="statHint">Actualmente vinculados a tu usuario.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Tokens disponibles</p>
          <p className="statValue">{availableTokens}</p>
          <p className="statHint">Listos para enviar a nuevos clientes.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Tokens usados</p>
          <p className="statValue">{usedTokens}</p>
          <p className="statHint">Ya convertidos en registros reales.</p>
        </article>
      </div>

      <NutritionistTokenForm />

      <div className="twoColLayout">
        <section className="sectionCard stack">
          <div className="panelHeader">
            <div>
              <h2 className="pageSectionTitle">Clientes asignados</h2>
              <p className="pageSectionSubtitle">Lectura rápida de tu cartera con última actividad conocida.</p>
            </div>
          </div>
          <div className="listGrid">
            {(clientRows ?? []).map((client: ClientRow) => {
              const profile = profilesById.get(client.user_id);
              const latestRecordedAt = latestEntriesByClient.get(client.user_id) ?? null;
              return (
                <article className="listCard" key={client.user_id}>
                  <div className="listCardHeader">
                    <div className="userStamp">
                      <div className="avatar">{(profile?.full_name ?? "C").slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{profile?.full_name ?? client.user_id}</strong>
                        <div className="metaText">@{profile?.username ?? "-"}</div>
                      </div>
                    </div>
                    <span className={`statusBadge ${latestRecordedAt ? "used" : "available"}`}>
                      {latestRecordedAt ? "Con seguimiento" : "Sin entradas"}
                    </span>
                  </div>
                  <div className="stack" style={{ gap: 8, marginTop: 14 }}>
                    <span className="metaText">{profile?.email ?? "Sin email"}</span>
                    <span className="metaText">Alta: {formatDate(client.created_at)}</span>
                    <span className="metaText">Última entrada: {formatDate(latestRecordedAt)}</span>
                  </div>
                </article>
              );
            })}
            {!clientRows?.length ? (
              <div className="emptyState">
                <strong>Aún no tienes clientes registrados</strong>
                <span className="subtitle">Genera un token de cliente y usa el alta guiada para activar la primera cuenta.</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="tablePanel stack">
          <div className="panelHeader">
            <div>
              <h2 className="pageSectionTitle">Últimos tokens de cliente</h2>
              <p className="pageSectionSubtitle">Invitaciones emitidas desde tu panel profesional.</p>
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
                {(tokens ?? []).map((token: TokenRow) => (
                  <tr key={token.token}>
                    <td className="tokenCell">{token.token}</td>
                    <td>
                      <span className={`statusBadge ${getStatusClass(token.status)}`}>{token.status}</span>
                    </td>
                    <td>{formatDate(token.created_at)}</td>
                    <td>{formatDate(token.expires_at)}</td>
                    <td>{formatDate(token.used_at)}</td>
                  </tr>
                ))}
                {!tokens?.length ? (
                  <tr>
                    <td colSpan={5}>Todavía no hay tokens de cliente generados.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
