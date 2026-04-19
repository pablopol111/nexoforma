import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/client-data";
import { RequestPanel } from "@/components/request-panel";
import { ProgressChart } from "@/components/progress-chart";
import { BodyPanel } from "@/components/body-panel";
import { CalendarSummary } from "@/components/calendar-summary";
import { dayDiffFromToday, formatDate, formatNumber, formatSteps } from "@/lib/utils";

export default async function ClientDashboardPage() {
  const session = await requireRole("client");
  const data = await getClientDashboardData(session.profile.id);
  const entries = data.dailyEntries;
  const latestEntry = entries.length ? entries[entries.length - 1] : null;
  const lastSeven = entries.slice(-7);
  const avgWeight = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.weight_kg, 0) / lastSeven.length : null;
  const avgSteps = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.steps, 0) / lastSeven.length : null;
  const vsReference = latestEntry && data.clientProfile?.reference_weight_kg != null ? latestEntry.weight_kg - data.clientProfile.reference_weight_kg : null;
  const vsObjective = latestEntry && data.clientProfile?.target_weight_kg != null ? latestEntry.weight_kg - data.clientProfile.target_weight_kg : null;
  const vsPrevious = entries.length > 1 ? latestEntry!.weight_kg - entries[entries.length - 2].weight_kg : null;
  const inactivityDays = dayDiffFromToday(latestEntry?.entry_date ?? null);
  const latestMeasurement = data.measurementEntries[0] ?? null;
  const previousMeasurement = data.measurementEntries[1] ?? null;

  return (
    <DashboardShell role="client" activeHref="/client/dashboard" pageTitle="Dashboard" pageDescription="Vista general de tu evolución." profileName={session.profile.full_name} profileSubtext={session.profile.email} actions={data.nutritionistProfile ? <span className="chip">{data.nutritionistProfile.full_name}</span> : null}>
      {inactivityDays !== null && inactivityDays >= 3 ? <div className="warningBox">Llevas {inactivityDays} días sin registrar datos. Conviene actualizar tu seguimiento.</div> : null}
      <RequestPanel requests={data.requests} />
      <div className="statsGrid">
        <article className="statCard"><span>Último peso</span><strong>{latestEntry ? `${formatNumber(latestEntry.weight_kg, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Últimos pasos</span><strong>{latestEntry ? formatSteps(latestEntry.steps) : "-"}</strong></article>
        <article className="statCard"><span>Media semanal peso</span><strong>{avgWeight != null ? `${formatNumber(avgWeight, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Media semanal pasos</span><strong>{avgSteps != null ? formatSteps(avgSteps) : "-"}</strong></article>
        <article className="statCard"><span>Vs referencia</span><strong className={vsReference !== null && vsReference <= 0 ? "successText" : "dangerText"}>{vsReference != null ? `${formatNumber(vsReference, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Vs objetivo</span><strong className={vsObjective !== null && vsObjective <= 0 ? "successText" : "dangerText"}>{vsObjective != null ? `${formatNumber(vsObjective, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Vs día anterior</span><strong className={vsPrevious !== null && vsPrevious <= 0 ? "successText" : "dangerText"}>{vsPrevious != null ? `${formatNumber(vsPrevious, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Último registro</span><strong>{formatDate(latestEntry?.entry_date ?? null)}</strong></article>
      </div>
      <section className="panel stack">
        <div className="panelHead"><h2>Resumen</h2></div>
        <p>{latestEntry ? `Último registro: ${formatNumber(latestEntry.weight_kg, 2)} kg y ${formatSteps(latestEntry.steps)} pasos. La media semanal está en ${avgWeight != null ? `${formatNumber(avgWeight, 2)} kg` : "-"} y ${avgSteps != null ? formatSteps(avgSteps) : "-"} pasos.` : "Aún no hay registros suficientes para generar un resumen."}</p>
      </section>
      <ProgressChart entries={entries} />
      <BodyPanel referenceWeight={data.clientProfile?.reference_weight_kg ?? null} currentWeight={latestEntry?.weight_kg ?? null} predictedWeight={data.clientProfile?.target_weight_kg ?? null} ready={Boolean(data.clientProfile)} latestMeasurements={latestMeasurement} previousMeasurements={previousMeasurement} />
      <CalendarSummary dailyEntries={data.dailyEntries} measurementEntries={data.measurementEntries} mode="summary" />
    </DashboardShell>
  );
}
