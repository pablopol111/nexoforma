import { ClientProfileEditor } from "@/components/client-profile-editor";
import { DailyEntryForm } from "@/components/daily-entry-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { MeasurementEntryForm } from "@/components/measurement-entry-form";
import { ProgressChart } from "@/components/progress-chart";
import { RequestPanel } from "@/components/request-panel";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatNumber, formatSteps } from "@/lib/utils";

export default async function ClientPage() {
  const session = await requireRole("client");
  const admin = createAdminClient();

  const [{ data: clientProfile }, { data: client }, { data: dailyEntries }, { data: measurementEntries }, { data: requests }] = await Promise.all([
    admin.from("client_profiles").select("*").eq("client_user_id", session.profile.id).maybeSingle(),
    admin.from("clients").select("user_id, nutritionist_user_id").eq("user_id", session.profile.id).maybeSingle(),
    admin.from("daily_entries").select("*").eq("client_user_id", session.profile.id).order("entry_date", { ascending: true }),
    admin.from("measurement_entries").select("*").eq("client_user_id", session.profile.id).order("entry_date", { ascending: false }),
    admin.from("measurement_requests").select("id, requested_at, weight_status, measurements_status").eq("client_user_id", session.profile.id).or("weight_status.eq.pending,measurements_status.eq.pending").order("requested_at", { ascending: false }),
  ]);

  const nutritionistProfile = client
    ? await admin.from("profiles").select("full_name, email").eq("id", (client as { nutritionist_user_id: string }).nutritionist_user_id).maybeSingle()
    : { data: null };

  const entries = (dailyEntries ?? []) as { id: string; entry_date: string; weight_kg: number; steps: number; comment: string | null }[];
  const latestEntry = entries.length ? entries[entries.length - 1] : null;
  const firstEntry = entries.length ? entries[0] : null;
  const latestSteps = latestEntry?.steps ?? null;
  const vsReference = latestEntry && clientProfile?.reference_weight_kg != null ? latestEntry.weight_kg - clientProfile.reference_weight_kg : null;
  const vsObjective = latestEntry && clientProfile?.target_weight_kg != null ? latestEntry.weight_kg - clientProfile.target_weight_kg : null;
  const vsPrevious = entries.length > 1 ? latestEntry!.weight_kg - entries[entries.length - 2].weight_kg : null;
  const lastSeven = entries.slice(-7);
  const avgWeight = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.weight_kg, 0) / lastSeven.length : null;
  const avgSteps = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.steps, 0) / lastSeven.length : null;
  const lastRecordDate = latestEntry?.entry_date ?? null;
  const requestsList = (requests ?? []) as { id: string; requested_at: string; weight_status: string; measurements_status: string }[];

  return (
    <DashboardShell
      role="client"
      activeHref="/client"
      pageTitle="Dashboard"
      pageDescription="Tu progreso diario, claro y cerca."
      profileName={session.profile.full_name}
      profileSubtext={session.profile.email}
      actions={nutritionistProfile.data ? <span className="chip">{(nutritionistProfile.data as { full_name: string }).full_name}</span> : null}
    >
      <RequestPanel requests={requestsList} />
      <div className="statsGrid">
        <article className="statCard"><span>Último peso</span><strong>{latestEntry ? `${formatNumber(latestEntry.weight_kg, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Últimos pasos</span><strong>{latestSteps != null ? formatSteps(latestSteps) : "-"}</strong></article>
        <article className="statCard"><span>Media semanal peso</span><strong>{avgWeight != null ? `${formatNumber(avgWeight, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Media semanal pasos</span><strong>{avgSteps != null ? formatSteps(avgSteps) : "-"}</strong></article>
        <article className="statCard"><span>Vs referencia</span><strong>{vsReference != null ? `${formatNumber(vsReference, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Vs objetivo</span><strong>{vsObjective != null ? `${formatNumber(vsObjective, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Vs día anterior</span><strong>{vsPrevious != null ? `${formatNumber(vsPrevious, 2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Último registro</span><strong>{formatDate(lastRecordDate)}</strong></article>
      </div>
      <section className="panel stack">
        <div className="panelHead"><h2>Resumen</h2></div>
        <p>{latestEntry ? `Tu última actualización refleja ${formatNumber(latestEntry.weight_kg, 2)} kg y ${formatSteps(latestEntry.steps)} pasos. La tendencia semanal se mueve en ${avgWeight != null ? `${formatNumber(avgWeight, 2)} kg de media` : "-"}.` : "Aún no hay datos suficientes para generar un resumen."}</p>
      </section>
      <ProgressChart entries={entries} />
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
          <div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Peso</th><th>Pasos</th><th>Comentario</th></tr></thead><tbody>{entries.slice().reverse().slice(0, 14).map((item) => <tr key={item.id}><td>{item.entry_date}</td><td>{formatNumber(item.weight_kg, 2)} kg</td><td>{formatSteps(item.steps)}</td><td>{item.comment ?? "-"}</td></tr>)}</tbody></table></div>
        </section>
        <section className="panel stack">
          <div className="panelHead"><h2>Histórico de medidas</h2></div>
          <div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Cintura</th><th>Cadera</th><th>Muslo</th><th>Bíceps</th><th>Pecho</th><th>Comentario</th></tr></thead><tbody>{((measurementEntries ?? []) as any[]).slice(0, 10).map((item) => <tr key={item.id}><td>{item.entry_date}</td><td>{formatNumber(item.waist_cm,2)}</td><td>{formatNumber(item.hip_cm,2)}</td><td>{formatNumber(item.thigh_relaxed_cm,2)}</td><td>{formatNumber(item.biceps_flexed_cm,2)}</td><td>{formatNumber(item.chest_cm,2)}</td><td>{item.comment ?? "-"}</td></tr>)}</tbody></table></div>
        </section>
      </div>
      <section className="panel stack">
        <div className="panelHead"><h2>Siluetas</h2></div>
        <div className="bodyGrid">
          <article className="silhouetteCard"><strong>Referencia · {clientProfile?.reference_weight_kg ? `${formatNumber(clientProfile.reference_weight_kg,2)} kg` : "-"}</strong><div className="silhouettePlaceholder">Frontal</div></article>
          <article className="silhouetteCard"><strong>Actual · {latestEntry ? `${formatNumber(latestEntry.weight_kg,2)} kg` : "-"}</strong><div className="silhouettePlaceholder">Actual</div></article>
          <article className="silhouetteCard"><strong>Previsto · {clientProfile?.target_weight_kg ? `${formatNumber(clientProfile.target_weight_kg,2)} kg` : "-"}</strong><div className="silhouettePlaceholder">Previsto</div></article>
        </div>
        <small>Bloque listo para evolucionar hacia siluetas más anatómicas y premium.</small>
      </section>
    </DashboardShell>
  );
}
