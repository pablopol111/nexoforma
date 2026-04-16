import { AdminTokenForm } from "@/components/admin-token-form";
import { LogoutButton } from "@/components/logout-button";
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

export default async function AdminPage() {
  const session = await requireRole("admin");
  const admin = createAdminClient();

  const { data: tokens } = await admin
    .from("access_tokens")
    .select("token, status, created_at, expires_at, used_at")
    .eq("token_type", "nutritionist_invite")
    .order("created_at", { ascending: false })
    .limit(15)
    .returns<TokenRow[]>();

  const totalTokens = tokens?.length ?? 0;
  const availableTokens = tokens?.filter((token) => token.status === "available").length ?? 0;
  const usedTokens = tokens?.filter((token) => token.status === "used").length ?? 0;

  return (
    <main>
      <div className="container stack">
        <section className="card heroCard">
          <div className="heroGrid">
            <div className="stack">
              <span className="kicker">Administrador</span>
              <h1 className="title">Control de invitaciones de nutricionista.</h1>
              <p className="subtitle">
                Bienvenido, {session.profile.full_name}. Desde aquí puedes generar tokens de alta
                y supervisar el estado reciente de las invitaciones emitidas.
              </p>
            </div>
            <div className="heroPanel stack">
              <div className="panelHeader">
                <span className="badge secondary">Sesión interna</span>
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
            <p className="statLabel">Tokens visibles</p>
            <p className="statValue">{totalTokens}</p>
            <p className="statHint">Últimos tokens cargados en el panel</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Disponibles</p>
            <p className="statValue">{availableTokens}</p>
            <p className="statHint">Pendientes de uso</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Usados</p>
            <p className="statValue">{usedTokens}</p>
            <p className="statHint">Ya asociados a nutricionistas</p>
          </div>
        </section>

        <AdminTokenForm />

        <section className="card">
          <div className="panelHeader" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="pageSectionTitle">Últimos tokens de nutricionista</h2>
              <p className="pageSectionSubtitle">
                Listado operativo con el estado y caducidad de las invitaciones emitidas.
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
