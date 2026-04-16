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

type NutritionistProfile = {
  id: string;
  username: string;
  full_name: string;
  email: string;
};

type NutritionistRow = {
  user_id: string;
  clinic_name: string;
  created_at: string;
};

function getStatusClass(status: string) {
  return status === "used" ? "used" : status === "revoked" ? "revoked" : "available";
}

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

  const { data: nutritionistRows } = await admin
    .from("nutritionists")
    .select("user_id, clinic_name, created_at")
    .order("created_at", { ascending: false })
    .returns<NutritionistRow[]>();

  const nutritionistIds = (nutritionistRows ?? []).map((row: NutritionistRow) => row.user_id);
  let profilesById = new Map<string, NutritionistProfile>();

  if (nutritionistIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username, full_name, email")
      .in("id", nutritionistIds)
      .returns<NutritionistProfile[]>();

    profilesById = new Map((profiles ?? []).map((profile: NutritionistProfile) => [profile.id, profile]));
  }

  const totalTokens = tokens?.length ?? 0;
  const availableTokens = tokens?.filter((token: TokenRow) => token.status === "available").length ?? 0;
  const usedTokens = tokens?.filter((token: TokenRow) => token.status === "used").length ?? 0;
  const totalNutritionists = nutritionistRows?.length ?? 0;

  return (
    <DashboardShell
      role="admin"
      activeHref="/admin"
      workspaceLabel="Panel central | Administración"
      pageTitle="Control de invitaciones y estructura profesional"
      pageDescription="Gestiona la entrada de nutricionistas, revisa el estado de los tokens y mantén una visión clara de la red activa dentro de NexoForma."
      profileName={session.profile.full_name}
      profileSubtext={`${session.profile.username} · ${session.profile.email}`}
      topBadges={<span className="roleChip">Admin</span>}
      heroMetrics={
        <>
          <div className="panelHeader">
            <div>
              <span className="kicker">Dashboard operativo</span>
              <h2 className="title compact">Visión rápida del sistema</h2>
              <p className="subtitle">Inspirado en una interfaz de panel profesional: contraste alto, bloques claros y lectura rápida de estados.</p>
            </div>
          </div>
          <div className="heroStats">
            <div className="heroMiniCard">
              <p className="statLabel">Tokens visibles</p>
              <p className="statValue">{totalTokens}</p>
              <p className="statHint">Últimos cargados en el panel</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Disponibles</p>
              <p className="statValue">{availableTokens}</p>
              <p className="statHint">Listos para alta</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Usados</p>
              <p className="statValue">{usedTokens}</p>
              <p className="statHint">Ya asociados</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Nutricionistas</p>
              <p className="statValue">{totalNutritionists}</p>
              <p className="statHint">Base actual</p>
            </div>
          </div>
        </>
      }
    >
      <div className="grid cols-4">
        <article className="statCard">
          <p className="statLabel">Tokens activos</p>
          <p className="statValue">{availableTokens}</p>
          <p className="statHint">Pendientes de uso por profesionales.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Tokens usados</p>
          <p className="statValue">{usedTokens}</p>
          <p className="statHint">Altas ya completadas correctamente.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Equipo nutricionista</p>
          <p className="statValue">{totalNutritionists}</p>
          <p className="statHint">Profesionales dados de alta en la base.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Perfil activo</p>
          <p className="statValue">Admin</p>
          <p className="statHint">Sesión con permisos completos.</p>
        </article>
      </div>

      <AdminTokenForm />

      <div className="twoColLayout">
        <section className="tablePanel stack">
          <div className="panelHeader">
            <div>
              <h2 className="pageSectionTitle">Últimos tokens de nutricionista</h2>
              <p className="pageSectionSubtitle">Estado operativo, fecha de creación, caducidad y uso.</p>
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
                    <td colSpan={5}>Todavía no hay tokens generados.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sectionCard stack">
          <div className="panelHeader">
            <div>
              <h2 className="pageSectionTitle">Nutricionistas recientes</h2>
              <p className="pageSectionSubtitle">Vista compacta de la red profesional dada de alta.</p>
            </div>
          </div>

          <div className="listGrid">
            {(nutritionistRows ?? []).slice(0, 8).map((row: NutritionistRow) => {
              const profile = profilesById.get(row.user_id);
              return (
                <article className="listCard" key={row.user_id}>
                  <div className="listCardHeader">
                    <div className="userStamp">
                      <div className="avatar">{(profile?.full_name ?? "N").slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{profile?.full_name ?? row.user_id}</strong>
                        <div className="metaText">@{profile?.username ?? "-"}</div>
                      </div>
                    </div>
                    <span className="miniChip">{row.clinic_name}</span>
                  </div>
                  <div className="stack" style={{ gap: 8, marginTop: 14 }}>
                    <span className="metaText">{profile?.email ?? "Sin email"}</span>
                    <span className="metaText">Alta: {formatDate(row.created_at)}</span>
                  </div>
                </article>
              );
            })}
            {!nutritionistRows?.length ? (
              <div className="emptyState">
                <strong>Aún no hay nutricionistas registrados</strong>
                <span className="subtitle">Genera un token y usa el alta profesional para completar el primer acceso.</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
