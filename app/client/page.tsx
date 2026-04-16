import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

type EntryRow = {
  id: string;
  weight_kg: number;
  body_fat_pct: number | null;
  notes: string | null;
  recorded_at: string;
};

type ClientRow = {
  nutritionist_user_id: string;
};

type NutritionistProfile = {
  full_name: string;
  email: string;
};

export default async function ClientPage() {
  const session = await requireRole("client");
  const admin = createAdminClient();

  const { data: clientRowData } = await admin
    .from("clients")
    .select("nutritionist_user_id")
    .eq("user_id", session.profile.id)
    .maybeSingle();

  const clientRow = (clientRowData ?? null) as ClientRow | null;

  let nutritionistProfile: NutritionistProfile | null = null;

  if (clientRow?.nutritionist_user_id) {
    const { data } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", clientRow.nutritionist_user_id)
      .maybeSingle();

    nutritionistProfile = (data ?? null) as NutritionistProfile | null;
  }

  const { data: entries } = await admin
    .from("entries")
    .select("id, weight_kg, body_fat_pct, notes, recorded_at")
    .eq("client_user_id", session.profile.id)
    .order("recorded_at", { ascending: false })
    .limit(10)
    .returns<EntryRow[]>();

  return (
    <main>
      <div className="container stack">
        <div className="card">
          <div className="grid cols-2" style={{ alignItems: "center" }}>
            <div>
              <span className="badge">Cliente</span>
              <h1 className="title">Panel de cliente</h1>
              <p className="subtitle">Bienvenido, {session.profile.full_name}.</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Mi nutricionista</h2>
          {nutritionistProfile ? (
            <div className="stack">
              <p>
                <strong>Nombre:</strong> {nutritionistProfile.full_name}
              </p>
              <p>
                <strong>Email:</strong> {nutritionistProfile.email}
              </p>
            </div>
          ) : (
            <p>No tienes un nutricionista asociado.</p>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Últimos registros</h2>
          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso</th>
                  <th>% grasa</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {(entries ?? []).map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.recorded_at)}</td>
                    <td>{entry.weight_kg}</td>
                    <td>{entry.body_fat_pct ?? "-"}</td>
                    <td>{entry.notes ?? "-"}</td>
                  </tr>
                ))}
                {!entries?.length && (
                  <tr>
                    <td colSpan={4}>Todavía no hay registros de seguimiento.</td>
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
