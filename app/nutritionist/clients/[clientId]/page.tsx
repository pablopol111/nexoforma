import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProgressChart } from "@/components/progress-chart";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumber, formatSteps } from "@/lib/utils";

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

type ClientProfileRow = {
  client_user_id: string;
  height_cm: number | null;
  reference_weight_kg: number | null;
  target_weight_kg: number | null;
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

export default async function NutritionistClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await requireRole("nutritionist");
  const { clientId } = await params;
  const admin = createAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("user_id, nutritionist_user_id")
    .eq("user_id", clientId)
    .eq("nutritionist_user_id", session.profile.id)
    .maybeSingle();

  const clientRow = (client ?? null) as ClientRow | null;

  if (!clientRow) {
    notFound();
  }

  const { data: profile } = await admin.from("profiles").select("id, username, full_name, email").eq("id", clientId).maybeSingle();
  const { data: clientProfile } = await admin.from("client_profiles").select("client_user_id, height_cm, reference_weight_kg, target_weight_kg").eq("client_user_id", clientId).maybeSingle();
  const { data: entries } = await admin
    .from("entries")
    .select("id, client_user_id, recorded_by_user_id, entry_date, weight_kg, steps, created_at")
    .eq("client_user_id", clientId)
    .order("entry_date", { ascending: true })
    .returns<EntryRow[]>();

  const profileRow = profile as ProfileRow | null;
  const clientProfileRow = clientProfile as ClientProfileRow | null;
  const latestEntry = entries?.length ? entries[entries.length - 1] : null;

  return (
    <DashboardShell
      role="nutritionist"
      activeHref="/nutritionist"
      pageTitle={profileRow?.full_name ?? "Cliente"}
      pageDescription="Vista de solo lectura."
      profileName={session.profile.full_name}
      profileSubtext={session.profile.email}
      actions={<a className="secondaryLink smallLink" href="/nutritionist">Volver</a>}
    >
      <div className="statsGrid">
        <article className="statCard"><span>Peso actual</span><strong>{latestEntry ? `${formatNumber(latestEntry.weight_kg)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Pasos</span><strong>{latestEntry ? formatSteps(latestEntry.steps) : "-"}</strong></article>
        <article className="statCard"><span>Altura</span><strong>{clientProfileRow?.height_cm ? `${formatNumber(clientProfileRow.height_cm)} cm` : "-"}</strong></article>
        <article className="statCard"><span>Objetivo</span><strong>{clientProfileRow?.target_weight_kg ? `${formatNumber(clientProfileRow.target_weight_kg)} kg` : "-"}</strong></article>
      </div>
      <ProgressChart entries={entries ?? []} />
      <section className="panel stack">
        <div className="panelHead"><h2>Perfil</h2></div>
        <div className="detailsGrid">
          <div className="detailCard"><span>Usuario</span><strong>@{profileRow?.username ?? "-"}</strong></div>
          <div className="detailCard"><span>Email</span><strong>{profileRow?.email ?? "-"}</strong></div>
          <div className="detailCard"><span>Peso de referencia</span><strong>{clientProfileRow?.reference_weight_kg ? `${formatNumber(clientProfileRow.reference_weight_kg)} kg` : "-"}</strong></div>
          <div className="detailCard"><span>Peso objetivo</span><strong>{clientProfileRow?.target_weight_kg ? `${formatNumber(clientProfileRow.target_weight_kg)} kg` : "-"}</strong></div>
        </div>
      </section>
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