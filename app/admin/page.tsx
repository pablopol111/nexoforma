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

  return (
    <main>
      <div className="container stack">
        <div className="card">
          <div className="grid cols-2" style={{ alignItems: "center" }}>
            <div>
              <span className="badge">Administrador</span>
              <h1 className="title">Panel de administración</h1>
              <p className="subtitle">
                Bienvenido, {session.profile.full_name}. Desde aquí puedes generar
                tokens de invitación para nutricionistas.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <LogoutButton />
            </div>
          </div>
        </div>

        <AdminTokenForm />

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Últimos tokens de nutricionista</h2>
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
        </div>
      </div>
    </main>
  );
}
