import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatNumber, formatSteps } from "@/lib/utils";

export default async function NutritionistClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("nutritionist");
  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: profile }, { data: clientProfile }, { data: entries }, { data: measurements }, { data: requests }] = await Promise.all([
    admin.from("profiles").select("full_name, username, email").eq("id", id).maybeSingle(),
    admin.from("client_profiles").select("*").eq("client_user_id", id).maybeSingle(),
    admin.from("daily_entries").select("*").eq("client_user_id", id).order("entry_date", { ascending: false }),
    admin.from("measurement_entries").select("*").eq("client_user_id", id).order("entry_date", { ascending: false }),
    admin.from("measurement_requests").select("requested_at, weight_status, weight_completed_at, measurements_status, measurements_completed_at").eq("client_user_id", id).order("requested_at", { ascending: false }),
  ]);
  const latest = (entries as any[] | null)?.[0] ?? null;
  const lastSeven = ((entries ?? []) as any[]).slice(0, 7);
  const avgWeight = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.weight_kg, 0) / lastSeven.length : null;
  const avgSteps = lastSeven.length ? lastSeven.reduce((sum, item) => sum + item.steps, 0) / lastSeven.length : null;

  return (
    <DashboardShell role="nutritionist" activeHref="/nutritionist" pageTitle={profile?.full_name ?? "Cliente"} pageDescription="Vista de seguimiento adaptada para nutrición." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <div className="statsGrid">
        <article className="statCard"><span>Último peso</span><strong>{latest ? `${formatNumber(latest.weight_kg,2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Últimos pasos</span><strong>{latest ? formatSteps(latest.steps) : "-"}</strong></article>
        <article className="statCard"><span>Media semanal peso</span><strong>{avgWeight != null ? `${formatNumber(avgWeight,2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Media semanal pasos</span><strong>{avgSteps != null ? formatSteps(avgSteps) : "-"}</strong></article>
        <article className="statCard"><span>Peso objetivo</span><strong>{clientProfile?.target_weight_kg ? `${formatNumber(clientProfile.target_weight_kg,2)} kg` : "-"}</strong></article>
        <article className="statCard"><span>Último registro</span><strong>{latest ? formatDate(latest.entry_date) : "-"}</strong></article>
      </div>
      <div className="columns two alignStart">
        <section className="panel stack"><div className="panelHead"><h2>Datos clave</h2></div><div className="profileGrid"><article className="miniCard"><span>Altura</span><strong>{clientProfile?.height_cm ? `${formatNumber(clientProfile.height_cm,2)} cm` : "-"}</strong></article><article className="miniCard"><span>Peso referencia</span><strong>{clientProfile?.reference_weight_kg ? `${formatNumber(clientProfile.reference_weight_kg,2)} kg` : "-"}</strong></article><article className="miniCard"><span>Peso objetivo</span><strong>{clientProfile?.target_weight_kg ? `${formatNumber(clientProfile.target_weight_kg,2)} kg` : "-"}</strong></article></div></section>
        <section className="panel stack"><div className="panelHead"><h2>Solicitudes</h2></div><div className="tableWrap"><table><thead><tr><th>Solicitud</th><th>Estado peso</th><th>Completado peso</th><th>Estado medidas</th><th>Completado medidas</th></tr></thead><tbody>{((requests ?? []) as any[]).map((item, index) => <tr key={index}><td>{formatDateTime(item.requested_at)}</td><td>{item.weight_status}</td><td>{formatDateTime(item.weight_completed_at)}</td><td>{item.measurements_status}</td><td>{formatDateTime(item.measurements_completed_at)}</td></tr>)}</tbody></table></div></section>
      </div>
      <div className="columns two alignStart">
        <section className="panel stack"><div className="panelHead"><h2>Histórico diario</h2></div><div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Peso</th><th>Pasos</th><th>Comentario</th></tr></thead><tbody>{((entries ?? []) as any[]).slice(0, 14).map((item) => <tr key={item.id}><td>{item.entry_date}</td><td>{formatNumber(item.weight_kg,2)} kg</td><td>{formatSteps(item.steps)}</td><td>{item.comment ?? "-"}</td></tr>)}</tbody></table></div></section>
        <section className="panel stack"><div className="panelHead"><h2>Histórico de medidas</h2></div><div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Cintura</th><th>Cadera</th><th>Pecho</th><th>Comentario</th></tr></thead><tbody>{((measurements ?? []) as any[]).slice(0, 10).map((item) => <tr key={item.id}><td>{item.entry_date}</td><td>{formatNumber(item.waist_cm,2)}</td><td>{formatNumber(item.hip_cm,2)}</td><td>{formatNumber(item.chest_cm,2)}</td><td>{item.comment ?? "-"}</td></tr>)}</tbody></table></div></section>
      </div>
    </DashboardShell>
  );
}
