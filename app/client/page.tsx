import { DashboardShell } from "@/components/dashboard-shell";
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

function formatDelta(value: number | null, suffix: string) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} ${suffix}`;
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
    .limit(24)
    .returns<EntryRow[]>();

  const latestEntry = entries?.[0] ?? null;
  const oldestEntry = entries?.length ? entries[entries.length - 1] : null;

  const weightChange = latestEntry && oldestEntry ? latestEntry.weight_kg - oldestEntry.weight_kg : null;
  const bodyFatChange =
    latestEntry &&
    oldestEntry &&
    latestEntry.body_fat_pct != null &&
    oldestEntry.body_fat_pct != null
      ? latestEntry.body_fat_pct - oldestEntry.body_fat_pct
      : null;

  const checkpoints = [
    {
      label: "Consistencia de seguimiento",
      value: Math.min((entries?.length ?? 0) * 12.5, 100),
      color: "#5da8ff",
    },
    {
      label: "Peso monitorizado",
      value: latestEntry ? 100 : 0,
      color: "#f1c84b",
    },
    {
      label: "Composición corporal",
      value: latestEntry?.body_fat_pct != null ? 100 : 30,
      color: "#27c07d",
    },
  ];

  return (
    <DashboardShell
      role="client"
      activeHref="/client"
      workspaceLabel="Mi seguimiento | Cliente"
      pageTitle="Mi evolución y progreso"
      pageDescription="Un dashboard más legible para que el usuario entienda rápido cómo va avanzando: métricas destacadas, gráfica reescalable y lectura limpia del histórico."
      profileName={session.profile.full_name}
      profileSubtext={`${session.profile.username} · ${session.profile.email}`}
      topBadges={<span className="roleChip">Cliente</span>}
      heroMetrics={
        <>
          <div className="panelHeader">
            <div>
              <span className="kicker">Seguimiento visual</span>
              <h2 className="title compact">Tus datos, con una presentación mucho más clara</h2>
              <p className="subtitle">La pantalla recupera el espíritu dashboard: mejor contraste, lectura rápida y evolución visible sin perder precisión.</p>
            </div>
          </div>
          <div className="heroStats">
            <div className="heroMiniCard">
              <p className="statLabel">Peso actual</p>
              <p className="statValue">{latestEntry ? latestEntry.weight_kg.toFixed(1) : "-"}</p>
              <p className="statHint">kg</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Variación peso</p>
              <p className="statValue">{formatDelta(weightChange, "kg")}</p>
              <p className="statHint">Desde tu primer registro</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">% grasa</p>
              <p className="statValue">{latestEntry?.body_fat_pct != null ? latestEntry.body_fat_pct.toFixed(1) : "-"}</p>
              <p className="statHint">Medición más reciente</p>
            </div>
            <div className="heroMiniCard">
              <p className="statLabel">Registros</p>
              <p className="statValue">{entries?.length ?? 0}</p>
              <p className="statHint">Histórico visible</p>
            </div>
          </div>
        </>
      }
    >
      <div className="grid cols-4">
        <article className="statCard">
          <p className="statLabel">Peso actual</p>
          <p className="statValue">{formatMetric(latestEntry?.weight_kg ?? null, "kg")}</p>
          <p className="statHint">Último registro disponible.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Variación peso</p>
          <p className={`statValue ${weightChange !== null && weightChange <= 0 ? "progressPositive" : weightChange !== null ? "progressNegative" : ""}`}>
            {formatDelta(weightChange, "kg")}
          </p>
          <p className="statHint">Comparado con el primer registro.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">% grasa actual</p>
          <p className="statValue">{formatMetric(latestEntry?.body_fat_pct ?? null, "%")}</p>
          <p className="statHint">Solo si hay medición disponible.</p>
        </article>
        <article className="statCard">
          <p className="statLabel">Variación % grasa</p>
          <p className={`statValue ${bodyFatChange !== null && bodyFatChange <= 0 ? "progressPositive" : bodyFatChange !== null ? "progressNegative" : ""}`}>
            {formatDelta(bodyFatChange, "%")}
          </p>
          <p className="statHint">Comparado con la primera medición.</p>
        </article>
      </div>

      <div className="twoColLayout">
        <section className="chartPanel">
          <ProgressChart entries={entries ?? []} />
        </section>

        <section className="sectionCard stack">
          <div>
            <h2 className="pageSectionTitle">Panel de estado</h2>
            <p className="pageSectionSubtitle">Resumen rápido del seguimiento actual y de tu relación con el nutricionista.</p>
          </div>

          <div className="metricBarList">
            {checkpoints.map((item: { label: string; value: number; color: string }) => (
              <div className="metricBarRow" key={item.label}>
                <div className="panelHeader" style={{ gap: 12 }}>
                  <strong>{item.label}</strong>
                  <span className="metaText">{Math.round(item.value)}%</span>
                </div>
                <div className="metricBarTrack">
                  <div className="metricBarFill" style={{ width: `${item.value}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="infoList">
            <div className="infoItem">
              <strong>Nutricionista</strong>
              <span>{nutritionistProfile?.full_name ?? "No asignado"}</span>
            </div>
            <div className="infoItem">
              <strong>Email</strong>
              <span>{nutritionistProfile?.email ?? "-"}</span>
            </div>
            <div className="infoItem">
              <strong>Última revisión</strong>
              <span>{formatDate(latestEntry?.recorded_at ?? null)}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid cols-2">
        <section className="sectionCard stack">
          <div>
            <h2 className="pageSectionTitle">Última observación</h2>
            <p className="pageSectionSubtitle">Texto asociado al último registro cargado en tu seguimiento.</p>
          </div>
          {latestEntry ? (
            <div className="notePanel">
              <strong>{formatDate(latestEntry.recorded_at)}</strong>
              <span className="subtitle">{latestEntry.notes ?? "Sin observaciones registradas en la última entrada."}</span>
            </div>
          ) : (
            <div className="emptyState">
              <strong>Todavía no hay observaciones</strong>
              <span className="subtitle">Cuando se registren entradas de seguimiento, aparecerán aquí con mejor contexto.</span>
            </div>
          )}
        </section>

        <section className="sectionCard stack">
          <div>
            <h2 className="pageSectionTitle">Lectura rápida del progreso</h2>
            <p className="pageSectionSubtitle">Cómo interpretar tus datos sin necesidad de entrar al detalle de cada fila.</p>
          </div>
          <div className="infoList">
            <div className="infoItem">
              <strong>Inicio visible</strong>
              <span>{formatMetric(oldestEntry?.weight_kg ?? null, "kg")}</span>
            </div>
            <div className="infoItem">
              <strong>Valor actual</strong>
              <span>{formatMetric(latestEntry?.weight_kg ?? null, "kg")}</span>
            </div>
            <div className="infoItem">
              <strong>Tendencia de peso</strong>
              <span>{weightChange === null ? "Sin datos" : weightChange <= 0 ? "Descenso o estabilidad" : "Incremento"}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="tablePanel stack">
        <div className="panelHeader">
          <div>
            <h2 className="pageSectionTitle">Histórico reciente</h2>
            <p className="pageSectionSubtitle">Tabla limpia para revisar punto a punto la evolución registrada.</p>
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
              {(entries ?? []).map((entry: EntryRow) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.recorded_at)}</td>
                  <td>{formatMetric(entry.weight_kg, "kg")}</td>
                  <td>{formatMetric(entry.body_fat_pct, "%")}</td>
                  <td>{entry.notes ?? "-"}</td>
                </tr>
              ))}
              {!entries?.length ? (
                <tr>
                  <td colSpan={4}>Todavía no hay registros de seguimiento.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
