import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/client-data";
import { ReportPreview } from "@/components/report-preview";

export default async function ClientReportPage() {
  const session = await requireRole("client");
  const data = await getClientDashboardData(session.profile.id);
  return (
    <DashboardShell role="client" activeHref="/client/report" pageTitle="Informe" pageDescription="Previsualiza el informe y descárgalo en PDF." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <ReportPreview dailyEntries={data.dailyEntries} measurementEntries={data.measurementEntries} clientProfile={data.clientProfile} />
    </DashboardShell>
  );
}
