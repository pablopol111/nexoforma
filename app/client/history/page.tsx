import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/client-data";
import { MeasurementsRadar } from "@/components/measurements-radar";
import { formatDate, formatNumber, formatSteps } from "@/lib/utils";

export default async function ClientHistoryPage() {
  const session = await requireRole("client");
  const data = await getClientDashboardData(session.profile.id);
  return (
    <DashboardShell role="client" activeHref="/client/history" pageTitle="Histórico" pageDescription="Consulta el histórico completo de registros y medidas." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <div className="columns two alignStart">
        <section className="panel stack">
          <div className="panelHead"><h2>Histórico diario</h2></div>
          <div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Peso</th><th>Pasos</th><th>Comentario</th></tr></thead><tbody>{data.dailyEntries.slice().reverse().map((item) => <tr key={item.id}><td>{formatDate(item.entry_date)}</td><td>{formatNumber(item.weight_kg, 2)} kg</td><td>{formatSteps(item.steps)}</td><td>{item.comment ?? '-'}</td></tr>)}</tbody></table></div>
        </section>
        <section className="panel stack">
          <div className="panelHead"><h2>Histórico de medidas</h2></div>
          <div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Cintura</th><th>Cadera</th><th>Muslo</th><th>Bíceps</th><th>Pecho</th></tr></thead><tbody>{data.measurementEntries.map((item) => <tr key={item.id}><td>{formatDate(item.entry_date)}</td><td>{formatNumber(item.waist_cm,2)}</td><td>{formatNumber(item.hip_cm,2)}</td><td>{formatNumber(item.thigh_relaxed_cm,2)}</td><td>{formatNumber(item.biceps_flexed_cm,2)}</td><td>{formatNumber(item.chest_cm,2)}</td></tr>)}</tbody></table></div>
        </section>
      </div>
      <MeasurementsRadar entries={data.measurementEntries.slice(0, 6)} />
    </DashboardShell>
  );
}
