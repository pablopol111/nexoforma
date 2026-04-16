import { LogoutButton } from "@/components/logout-button";
import { ProgressChart } from "@/components/progress-chart";
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

function formatMetric(value: number | null, suffix: string) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${Number(value).toFixed(1)} ${suffix}`;
}

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
    .limit(12)
    .returns<EntryRow[]>();

  const latestEntry = entries?.[0] ?? null;
  const oldestEntry = entries?.[entries.length - 1] ?? null;
  const weightChange = latestEntry && oldestEntry ? latestEntry.weight_kg - oldestEntry.weight_kg : null;
  const bodyFatChange =
    latestEntry?.body_fat_pct !== null && oldestEntry?.body_fat_pct !== null
      ? latestEntry.body_fat_pct - oldestEntry.body_fat_pct
      : null;

  return (
    <main>
      <div className="container stack">
        <section className="card heroCard">
          <div className="heroGrid">
            <div className="stack">
              <span className="kicker">Cliente</span>
              <h1 className="title">Seguimiento visual del progreso.</h1>
              <p className="subtitle">
                Bienvenido, {session.profile.full_name}. Tu panel recupera el estilo elegante
                y añade una gráfica con escala dinámica para que los cambios de peso y grasa se
                interpreten con mayor precisión.
              </p>
            </div>
            <div className="heroPanel stack">
              <div className="panelHeader">
                <span className="badge secondary">Sesión activa</span>
                <LogoutButton />
              </div>
              <div className="infoList">
                <div className="infoItem">
                  <strong>Usuario</strong>
                  <span>{session.profile.username}</span>
                </div>
                <div className="infoItem">
                  <strong>Email</strong>
                  <span>{session.profile.email}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid cols-4">
          <div className="statCard">
            <p className="statLabel">Peso actual</p>
            <p className="statValue">{formatMetric(latestEntry?.weight_kg ?? null, "kg")}</p>
            <p className="statHint">Último registro disponible</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Variación de peso</p>
            <p className="statValue">
              {weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : "-"}
            </p>
            <p className="statHint">Comparado con el primer registro cargado</p>
          </div>
          <div className="statCard">
            <p className="statLabel">% grasa actual</p>
            <p className="statValue">{formatMetric(latestEntry?.body_fat_pct ?? null, "%")}</p>
            <p className="statHint">Solo si existe medición</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Variación % grasa</p>
            <p className="statValue">
              {bodyFatChange !== null ? `${bodyFatChange > 0 ? "+" : ""}${bodyFatChange.toFixed(1)} %` : "-"}
            </p>
            <p className="statHint">Comparado con la primera medición</p>
          </div>
        </section>

        <section className="card">
          <ProgressChart entries={entries ?? []} />
        </section>

        <div className="grid cols-2">
          <section className="card stack">
            <div>
              <h2 className="pageSectionTitle">Mi nutricionista</h2>
              <p className="pageSectionSubtitle">
                Referencia del profesional asociado a tu seguimiento activo.
              </p>
            </div>
            {nutritionistProfile ? (
              <div className="infoList">
                <div className="infoItem">
                  <strong>Nombre</strong>
                  <span>{nutritionistProfile.full_name}</span>
                </div>
                <div className="infoItem">
                  <strong>Email</strong>
                  <span>{nutritionistProfile.email}</span>
                </div>
              </div>
            ) : (
              <p className="muted">No tienes un nutricionista asociado.</p>
            )}
          </section>

          <section className="card stack">
            <div>
              <h2 className="pageSectionTitle">Última observación</h2>
              <p className="pageSectionSubtitle">
                Resumen rápido del último seguimiento registrado.
              </p>
            </div>
            {latestEntry ? (
              <div className="infoList">
                <div className="infoItem">
                  <strong>Fecha</strong>
                  <span>{formatDate(latestEntry.recorded_at)}</span>
                </div>
                <div className="infoItem">
                  <strong>Notas</strong>
                  <span>{latestEntry.notes ?? "Sin observaciones registradas."}</span>
                </div>
              </div>
            ) : (
              <p className="muted">Todavía no hay registros de seguimiento.</p>
            )}
          </section>
        </div>

        <section className="card">
          <div className="panelHeader" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="pageSectionTitle">Histórico reciente</h2>
              <p className="pageSectionSubtitle">
                Tabla con los últimos registros cargados para revisar la evolución punto a punto.
              </p>
            </div>
          </div>
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
                    <td>{formatMetric(entry.weight_kg, "kg")}</td>
                    <td>{formatMetric(entry.body_fat_pct, "%")}</td>
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
        </section>
      </div>
    </main>
  );
}
