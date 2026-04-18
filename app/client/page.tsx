import { BodyPanel } from "@/components/body-panel";
import { CalendarSummary } from "@/components/calendar-summary";
import { ClientProfileEditor } from "@/components/client-profile-editor";
import { DailyEntryForm } from "@/components/daily-entry-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { MeasurementEntryForm } from "@/components/measurement-entry-form";
import { MeasurementRadar } from "@/components/measurement-radar";
import { ProgressChart } from "@/components/progress-chart";
import { RequestPanel } from "@/components/request-panel";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientProfileRecord, DailyEntryRecord, MeasurementEntryRecord } from "@/lib/types";
import { daysSinceDate, formatDate, formatNumber, formatSteps, isProfileCompleteForMeasurements } from "@/lib/utils";

type TrendTone = "positive" | "negative" | "neutral";

function getSignedWeight(value: number | null) {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value, 2)} kg`;
}

function getToneLabel(tone: TrendTone) {
  if (tone === "positive") return "Mejora";
  if (tone === "negative") return "Empeora";
  return "Estable";
}

function buildSummary(params: {
  latestEntry: DailyEntryRecord | null;
  avgWeight: number | null;
  avgSteps: number | null;
  vsObjective: number | null;
  vsReference: number | null;
  inactiveDays: number | null;
  pendingRequests: number;
}) {
  const { latestEntry, avgWeight, avgSteps, vsObjective, vsReference, inactiveDays, pendingRequests } = params;

  if (!latestEntry) {
    return {
      main: "Todavía no hay datos suficientes para construir un resumen útil. Tu siguiente paso es completar el primer registro diario y, si puedes, la primera toma de medidas.",
      secondary: pendingRequests ? `Tienes ${pendingRequests} solicitud${pendingRequests > 1 ? "es" : ""} pendiente${pendingRequests > 1 ? "s" : ""} de tu nutricionista.` : "En cuanto registres información, el dashboard empezará a mostrar tendencias reales.",
    };
  }

  const objectiveText = vsObjective == null
    ? "Aún no se puede medir tu distancia al objetivo."
    : vsObjective <= 0
      ? "Ya estás en objetivo o por debajo del peso marcado."
      : `Te separan ${formatNumber(vsObjective, 2)} kg del objetivo.`;

  const referenceText = vsReference == null
    ? "Sin comparación frente al peso de referencia."
    : vsReference < 0
      ? `Estás ${formatNumber(Math.abs(vsReference), 2)} kg por debajo de tu referencia.`
      : vsReference === 0
        ? "Estás exactamente en tu peso de referencia."
        : `Estás ${formatNumber(vsReference, 2)} kg por encima de tu referencia.`;

  const inactivityText = inactiveDays == null
    ? "No se puede calcular la frecuencia de registro."
    : inactiveDays >= 3
      ? `Llevas ${inactiveDays} días sin registrar datos, así que conviene retomar la rutina cuanto antes.`
      : "La frecuencia de registro es correcta y el seguimiento sigue vivo.";

  const requestText = pendingRequests
    ? `Además tienes ${pendingRequests} solicitud${pendingRequests > 1 ? "es" : ""} pendiente${pendingRequests > 1 ? "s" : ""} relacionadas con peso o medidas.`
    : "No tienes solicitudes pendientes de revisión ahora mismo.";

  return {
    main: `Tu último registro marca ${formatNumber(latestEntry.weight_kg, 2)} kg y ${formatSteps(latestEntry.steps)} pasos. La media reciente se mueve en ${avgWeight != null ? `${formatNumber(avgWeight, 2)} kg` : "-"} y ${avgSteps != null ? `${formatSteps(avgSteps)} pasos` : "-"}. ${objectiveText}`,
    secondary: `${referenceText} ${inactivityText} ${requestText}`,
  };
}

function getObjectiveTone(vsObjective: number | null): TrendTone {
  if (vsObjective === null) return "neutral";
  if (vsObjective <= 0) return "positive";
  return "negative";
}

function getReferenceTone(vsReference: number | null): TrendTone {
  if (vsReference === null || vsReference === 0) return "neutral";
  return vsReference < 0 ? "positive" : "negative";
}

function getLastRecordTone(inactiveDays: number | null): TrendTone {
  if (inactiveDays === null) return "neutral";
  if (inactiveDays >= 3) return "negative";
  return "positive";
}

function getPreviousTone(latestEntry: DailyEntryRecord | null, previousEntry: DailyEntryRecord | null, targetWeight: number | null): TrendTone {
  if (!latestEntry || !previousEntry) return "neutral";
  if (targetWeight == null) {
    if (latestEntry.weight_kg === previousEntry.weight_kg) return "neutral";
    return latestEntry.weight_kg < previousEntry.weight_kg ? "positive" : "negative";
  }

  const currentDistance = Math.abs(latestEntry.weight_kg - targetWeight);
  const previousDistance = Math.abs(previousEntry.weight_kg - targetWeight);
  if (currentDistance === previousDistance) return "neutral";
  return currentDistance < previousDistance ? "positive" : "negative";
}

function StatCard({ label, value, hint, tone = "neutral" }: { label: string; value: string; hint?: string; tone?: TrendTone }) {
  return (
    <article className="statCard enhancedStatCard">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small className={`statTone ${tone}`}>{getToneLabel(tone)} · {hint}</small> : null}
    </article>
  );
}

export default async function ClientPage() {
  const session = await requireRole("client");
  const admin = createAdminClient();

  const [{ data: clientProfileRaw }, { data: client }, { data: dailyEntries }, { data: measurementEntries }, { data: requests }] = await Promise.all([
    admin.from("client_profiles").select("*").eq("client_user_id", session.profile.id).maybeSingle(),
    admin.from("clients").select("user_id, nutritionist_user_id").eq("user_id", session.profile.id).maybeSingle(),
    admin.from("daily_entries").select("*").eq("client_user_id", session.profile.id).order("entry_date", { ascending: true }),
    admin.from("measurement_entries").select("*").eq("client_user_id", session.profile.id).order("entry_date", { ascending: false }),
    admin.from("measurement_requests").select("id, requested_at, weight_status, measurements_status").eq("client_user_id", session.profile.id).or("weight_status.eq.pending,measurements_status.eq.pending").order("requested_at", { ascending: false }),
  ]);

  const clientProfile = clientProfileRaw as ClientProfileRecord | null;
  const entries = (dailyEntries ?? []) as DailyEntryRecord[];
  const measurements = (measurementEntries ?? []) as MeasurementEntryRecord[];
  const requestsList = (requests ?? []) as { id: string; requested_at: string; weight_status: string; measurements_status: string }[];

  const nutritionistProfile = client
    ? await admin.from("profiles").select("full_name, email").eq("id", (client as { nutritionist_user_id: string }).nutritionist_user_id).maybeSingle()
    : { data: null };

  const latestEntry = entries.length ? entries[entries.length - 1] : null;
  const previousEntry = entries.length > 1 ? entries[entries.length - 2] : null;
  const latestMeasurement = measurements[0] ?? null;
  const latestSteps = latestEntry?.steps ?? null;
  const vsReference = latestEntry && clientProfile?.reference_weight_kg != null ? latestEntry.weight_kg - clientProfile.reference_weight_kg : null;
  const vsObjective = latestEntry && clientProfile?.target_weight_kg != null ? latestEntry.weight_kg - clientProfile.target_weight_kg : null;
  const vsPrevious = latestEntry && previousEntry ? latestEntry.weight_kg - previousEntry.weight_kg : null;
  const lastSeven = entries.slice(-7);
  const avgWeight = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.weight_kg, 0) / lastSeven.length : null;
  const avgSteps = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.steps, 0) / lastSeven.length : null;
  const lastRecordDate = latestEntry?.entry_date ?? null;
  const inactiveDays = daysSinceDate(lastRecordDate);
  const readyForBody = clientProfile ? isProfileCompleteForMeasurements(clientProfile) : false;
  const predictedWeight = latestEntry && vsObjective !== null
    ? Math.max(clientProfile?.target_weight_kg ?? latestEntry.weight_kg, latestEntry.weight_kg - Math.abs(vsObjective) * 0.35)
    : clientProfile?.target_weight_kg ?? null;
  const summary = buildSummary({
    latestEntry,
    avgWeight,
    avgSteps,
    vsObjective,
    vsReference,
    inactiveDays,
    pendingRequests: requestsList.length,
  });

  return (
    <DashboardShell
      role="client"
      activeHref="/client"
      pageTitle="Dashboard"
      pageDescription="Tu progreso diario, claro y bien conectado con tu seguimiento real."
      profileName={session.profile.full_name}
      profileSubtext={session.profile.email}
      actions={nutritionistProfile.data ? <span className="chip">{(nutritionistProfile.data as { full_name: string }).full_name}</span> : null}
    >
      {inactiveDays !== null && inactiveDays >= 3 ? (
        <section className="panel alertPanel stack">
          <div className="panelHead compactHead"><h2>Seguimiento inactivo</h2></div>
          <p>Han pasado {inactiveDays} días desde tu último registro. Conviene retomar peso, pasos y medidas para que el análisis vuelva a ser fiable.</p>
        </section>
      ) : null}

      <RequestPanel requests={requestsList} />

      <div className="statsGrid">
        <StatCard label="Último peso" value={latestEntry ? `${formatNumber(latestEntry.weight_kg, 2)} kg` : "-"} />
        <StatCard label="Últimos pasos" value={latestSteps != null ? formatSteps(latestSteps) : "-"} />
        <StatCard label="Media semanal peso" value={avgWeight != null ? `${formatNumber(avgWeight, 2)} kg` : "-"} />
        <StatCard label="Media semanal pasos" value={avgSteps != null ? formatSteps(avgSteps) : "-"} />
        <StatCard label="Vs referencia" value={getSignedWeight(vsReference)} hint={vsReference == null ? undefined : `${Math.abs(vsReference).toFixed(2).replace(".", ",")} kg respecto a referencia`} tone={getReferenceTone(vsReference)} />
        <StatCard label="Vs objetivo" value={getSignedWeight(vsObjective)} hint={vsObjective == null ? undefined : vsObjective <= 0 ? "Objetivo alcanzado" : `${formatNumber(vsObjective, 2)} kg por encima`} tone={getObjectiveTone(vsObjective)} />
        <StatCard label="Vs día anterior" value={getSignedWeight(vsPrevious)} hint={vsPrevious == null ? undefined : `${vsPrevious > 0 ? "Sube" : vsPrevious < 0 ? "Baja" : "Sin cambio"} frente al registro previo`} tone={getPreviousTone(latestEntry, previousEntry, clientProfile?.target_weight_kg ?? null)} />
        <StatCard label="Último registro" value={formatDate(lastRecordDate)} hint={inactiveDays == null ? undefined : inactiveDays === 0 ? "Hoy" : `${inactiveDays} día${inactiveDays === 1 ? "" : "s"} sin registrar`} tone={getLastRecordTone(inactiveDays)} />
      </div>

      <section className="panel stack summaryPanel">
        <div className="panelHead"><h2>Resumen inteligente</h2></div>
        <div className="summaryGrid">
          <p>{summary.main}</p>
          <p>{summary.secondary}</p>
        </div>
      </section>

      <CalendarSummary dailyEntries={entries} measurementEntries={measurements} />
      <ProgressChart entries={entries} />
      <BodyPanel referenceWeight={clientProfile?.reference_weight_kg ?? null} currentWeight={latestEntry?.weight_kg ?? latestMeasurement?.weight_kg ?? null} predictedWeight={predictedWeight} ready={readyForBody} />
      <MeasurementRadar entries={measurements} targetWeight={clientProfile?.target_weight_kg ?? null} />

      <div id="registros" className="columns two">
        <DailyEntryForm />
        <MeasurementEntryForm />
      </div>

      <ClientProfileEditor
        initialFirstName={clientProfile?.first_name ?? null}
        initialLastName={clientProfile?.last_name ?? null}
        initialAge={clientProfile?.age ?? null}
        initialSex={clientProfile?.sex ?? null}
        initialHeightCm={clientProfile?.height_cm ?? null}
        initialReferenceWeightKg={clientProfile?.reference_weight_kg ?? null}
        initialTargetWeightKg={clientProfile?.target_weight_kg ?? null}
      />

      <div id="historial" className="columns two alignStart">
        <section className="panel stack">
          <div className="panelHead"><h2>Histórico diario</h2></div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Peso</th><th>Pasos</th><th>Comentario</th></tr>
              </thead>
              <tbody>
                {entries.slice().reverse().slice(0, 14).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.entry_date)}</td>
                    <td>{formatNumber(item.weight_kg, 2)} kg</td>
                    <td>{formatSteps(item.steps)}</td>
                    <td>{item.comment ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <div className="panelHead"><h2>Histórico de medidas</h2></div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Cintura</th><th>Cadera</th><th>Muslo</th><th>Bíceps normal</th><th>Bíceps tensión</th><th>Pecho</th><th>Comentario</th></tr>
              </thead>
              <tbody>
                {measurements.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.entry_date)}</td>
                    <td>{formatNumber(item.waist_cm, 2)}</td>
                    <td>{formatNumber(item.hip_cm, 2)}</td>
                    <td>{formatNumber(item.thigh_relaxed_cm, 2)}</td>
                    <td>{formatNumber(item.biceps_normal_cm, 2)}</td>
                    <td>{formatNumber(item.biceps_flexed_cm, 2)}</td>
                    <td>{formatNumber(item.chest_cm, 2)}</td>
                    <td>{item.comment ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
