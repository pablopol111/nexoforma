import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/client-data";
import { DailyEntryForm } from "@/components/daily-entry-form";
import { MeasurementEntryForm } from "@/components/measurement-entry-form";

export default async function ClientRecordsPage() {
  const session = await requireRole("client");
  return (
    <DashboardShell role="client" activeHref="/client/records" pageTitle="Registros" pageDescription="Carga y actualiza tu peso, pasos y medidas." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <div className="columns two">
        <DailyEntryForm />
        <MeasurementEntryForm />
      </div>
    </DashboardShell>
  );
}
