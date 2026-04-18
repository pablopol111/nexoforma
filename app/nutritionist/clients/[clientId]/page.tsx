import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MeasurementRadar } from "@/components/measurement-radar";
import { ProgressChart } from "@/components/progress-chart";
import { RequestMeasurementsButton } from "@/components/request-measurements-button";
import { BodyPanel } from "@/components/body-panel";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatNumber, formatSteps, isProfileCompleteForMeasurements } from "@/lib/utils";
import type { DailyEntryRecord, MeasurementEntryRecord } from "@/lib/types";

type RequestRow = { id: string; requested_at: string; weight_status: string; weight_completed_at: string | null; measurements_status: string; measurements_completed_at: string | null };

export default async function NutritionistClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await requireRole("nutritionist");
  const { clientId } = await params;
  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("user_id, nutritionist_user_id").eq("user_id", clientId).eq("nutritionist_user_id", session.profile.id).maybeSingle();
  if (!client) notFound();

  const { data: profile } = await admin.from("profiles").select("id, username, full_name, email").eq("id", clientId).maybeSingle();
  const { data: clientProfile } = await admin.from("client_profiles").select("client_user_id, first_name, last_name, age, sex, height_cm, reference_weight_kg, target_weight_kg").eq("client_user_id", clientId).maybeSingle();
  const { data: dailyEntries } = await admin.from("daily_entries").select("id, client_user_id, entry_date, weight_kg, steps, comment, created_at, updated_at").eq("client_user_id", clientId).order("entry_date", { ascending: true }).returns<DailyEntryRecord[]>();
  const { data: measurementEntries } = await admin.from("measurement_entries").select("id, client_user_id, entry_date, weight_kg, waist_cm, hip_cm, thigh_relaxed_cm, biceps_normal_cm, biceps_flexed_cm, chest_cm, comment, created_at, updated_at").eq("client_user_id", clientId).order("entry_date", { ascending: false }).returns<MeasurementEntryRecord[]>();
  const { data: requests } = await admin.from("measurement_requests").select("id, requested_at, weight_status, weight_completed_at, measurements_status, measurements_completed_at").eq("client_user_id", clientId).order("requested_at", { ascending: false }).returns<RequestRow[]>();

  const latest = dailyEntries?.length ? dailyEntries[dailyEntries.length - 1] : null;
  const latestMeasurement = measurementEntries?.[0] ?? null;
  const previousMeasurement = measurementEntries?.[1] ?? null;
  const weekly = (dailyEntries ?? []).slice(-7);
  const avgWeight = weekly.length ? weekly.reduce((sum, item) => sum + item.weight_kg, 0) / weekly.length : null;
  const avgSteps = weekly.length ? weekly.reduce((sum, item) => sum + item.steps, 0) / weekly.length : null;
  const targetDiff = latest && clientProfile?.target_weight_kg ? latest.weight_kg - clientProfile.target_weight_kg : null;
  const ready = clientProfile ? isProfileCompleteForMeasurements(clientProfile) : false;
  const predicted = latest && targetDiff !== null ? Math.max(clientProfile?.target_weight_kg ?? latest.weight_kg, latest.weight_kg - Math.abs(targetDiff) * 0.35) : clientProfile?.target_weight_kg ?? null;

  return (
    <DashboardShell role="nutritionist" activeHref="/nutritionist" pageTitle={profile?.full_name ?? "Cliente"} pageDescription="Vista adaptada de seguimiento del cliente." profileName={session.profile.full_name} profileSubtext={session.profile.email} actions={<RequestMeasurementsButton clientId={clientId} />}>
      <div className="statsGrid">
        <article className="statCard"><span>Último peso</span><strong>{latest ? `${formatNumber(latest.weight_kg, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Últimos pasos</span><strong>{latest ? formatSteps(latest.steps) : "-"}</strong></article>
        <article className="statCard"><span>Media semanal peso</span><strong>{avgWeight !== null ? `${formatNumber(avgWeight, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Media semanal pasos</span><strong>{avgSteps !== null ? formatSteps(avgSteps) : "-"}</strong></article>
        <article className="statCard"><span>Vs objetivo</span><strong>{targetDiff !== null ? `${formatNumber(targetDiff, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Último registro</span><strong>{latest ? formatDate(latest.entry_date) : "-"}</strong></article>
      </div>
      <section className="panel stack"><div className="detailsGrid"><div className="detailCard"><span>Altura</span><strong>{clientProfile?.height_cm ? `${formatNumber(clientProfile.height_cm, 2)} cm` : "-"}</strong></div><div className="detailCard"><span>Peso referencia</span><strong>{clientProfile?.reference_weight_kg ? `${formatNumber(clientProfile.reference_weight_kg, 2)} kg` : "-"}</strong></div><div className="detailCard"><span>Peso objetivo</span><strong>{clientProfile?.target_weight_kg ? `${formatNumber(clientProfile.target_weight_kg, 2)} kg` : "-"}</strong></div></div></section>
      <ProgressChart entries={dailyEntries ?? []} />
      <BodyPanel referenceWeight={clientProfile?.reference_weight_kg ?? null} currentWeight={latest?.weight_kg ?? latestMeasurement?.weight_kg ?? null} predictedWeight={predicted} ready={ready} referenceMeasurements={previousMeasurement} currentMeasurements={latestMeasurement} />
      <MeasurementRadar entries={measurementEntries ?? []} targetWeight={clientProfile?.target_weight_kg ?? null} />
      <section className="panel columns two">
        <div className="stack"><div className="panelHead"><h2>Histórico peso</h2></div><div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Peso</th><th>Pasos</th><th>Comentario</th></tr></thead><tbody>{(dailyEntries ?? []).slice(-7).reverse().map((item) => <tr key={item.id}><td>{formatDate(item.entry_date)}</td><td>{formatNumber(item.weight_kg, 2)} kg</td><td>{formatSteps(item.steps)}</td><td>{item.comment ?? "-"}</td></tr>)}</tbody></table></div></div>
        <div className="stack"><div className="panelHead"><h2>Histórico medidas</h2></div><div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Cintura</th><th>Cadera</th><th>Pecho</th><th>Comentario</th></tr></thead><tbody>{(measurementEntries ?? []).slice(0, 7).map((item) => <tr key={item.id}><td>{formatDate(item.entry_date)}</td><td>{formatNumber(item.waist_cm, 2)}</td><td>{formatNumber(item.hip_cm, 2)}</td><td>{formatNumber(item.chest_cm, 2)}</td><td>{item.comment ?? "-"}</td></tr>)}</tbody></table></div></div>
      </section>
      <section className="panel stack"><div className="panelHead"><h2>Log de solicitudes</h2></div><div className="tableWrap"><table><thead><tr><th>Solicitada</th><th>Estado peso</th><th>Completado peso</th><th>Estado medidas</th><th>Completado medidas</th></tr></thead><tbody>{(requests ?? []).map((item) => <tr key={item.id}><td>{formatDate(item.requested_at)}</td><td>{item.weight_status}</td><td>{formatDate(item.weight_completed_at)}</td><td>{item.measurements_status}</td><td>{formatDate(item.measurements_completed_at)}</td></tr>)}</tbody></table></div></section>
    </DashboardShell>
  );
}
