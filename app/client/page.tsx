import { ClientProfileEditor } from "@/components/client-profile-editor";
import { DailyEntryForm } from "@/components/daily-entry-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProgressChart } from "@/components/progress-chart";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatNumber, formatSteps } from "@/lib/utils";

type ClientProfileRow = {
  client_user_id: string;
  height_cm: number | null;
  reference_weight_kg: number | null;
  target_weight_kg: number | null;
  created_at: string;
  updated_at: string;
};

type ClientRow = {
  user_id: string;
  nutritionist_user_id: string;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  email: string;
};

type EntryRow = {
  id: string;
  client_user_id: string;
  recorded_by_user_id: string;
  entry_date: string;
  weight_kg: number;
  steps: number;
  created_at: string;
};

export default async function ClientPage() {
  const session = await requireRole("client");
  const admin = createAdminClient();

  const { data: clientProfile } = await admin
    .from("client_profiles")
    .select("client_user_id, height_cm, reference_weight_kg, target_weight_kg, created_at, updated_at")
    .eq("client_user_id", session.profile.id)
    .maybeSingle();

  const { data: client } = await admin
    .from("clients")
    .select("user_id, nutritionist_user_id")
    .eq("user_id", session.profile.id)
    .maybeSingle();

  const clientRow = (client ?? null) as ClientRow | null;

  const { data: nutritionistProfile } = clientRow
    ? await admin.from("profiles").select("id, username, full_name, email").eq("id", clientRow.nutritionist_user_id).maybeSingle()
    : { data: null as ProfileRow | null };

  const { data: entries } = await admin
    .from("entries")
    .select("id, client_user_id, recorded_by_user_id, entry_date, weight_kg, steps, created_at")
    .eq("client_user_id", session.profile.id)
    .order("entry_date", { ascending: true })
    .returns<EntryRow[]>();

  const clientProfileRow = (clientProfile ?? null) as ClientProfileRow | null;
  const latestEntry = entries?.length ? entries[entries.length - 1] : null;
  const firstEntry = entries?.length ? entries[0] : null;
  const weightChange = latestEntry && firstEntry ? latestEntry.weight_kg - firstEntry.weight_kg : null;

  return (
    <DashboardShell
      role="client"
      activeHref="/client"
      pageTitle="Mi progreso"
      pageDescription="Tu registro diario y tu evolución en un solo lugar."
      profileName={session.profile.full_name}
      profileSubtext={session.profile.email}
      actions={nutritionistProfile ? <span className="chip">{nutritionistProfile.full_name}</span> : null}
    >
      <div className="statsGrid">
        <article className="statCard"><span>Peso actual</span><strong>{latestEntry ? `${formatNumber(latestEntry.weight_kg)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Cambio</span><strong>{weightChange === null ? "-" : `${formatNumber(weightChange)} kg`}</strong></article>
        <article className="statCard"><span>Pasos</span><strong>{latestEntry ? formatSteps(latestEntry.steps) : "-"}</strong></article>
        <article className="statCard"><span>Último registro</span><strong>{latestEntry ? formatDate(latestEntry.entry_date) : "-"}</strong></article>
      </div>
      <ProgressChart entries={entries ?? []} />
      <div className="columns two">
        <ClientProfileEditor
          initialHeightCm={clientProfileRow?.height_cm ?? null}
          initialReferenceWeightKg={clientProfileRow?.reference_weight_kg ?? null}
          initialTargetWeightKg={clientProfileRow?.target_weight_kg ?? null}
        />
        <DailyEntryForm />
      </div>
      <section className="panel stack">
        <div className="panelHead"><h2>Histórico</h2></div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Peso</th><th>Pasos</th></tr>
            </thead>
            <tbody>
              {(entries ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{item.entry_date}</td>
                  <td>{formatNumber(item.weight_kg)} kg</td>
                  <td>{formatSteps(item.steps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}