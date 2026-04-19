import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/client-data";
import { CalendarSummary } from "@/components/calendar-summary";

export default async function ClientCalendarPage() {
  const session = await requireRole("client");
  const data = await getClientDashboardData(session.profile.id);
  return (
    <DashboardShell role="client" activeHref="/client/calendar" pageTitle="Calendario" pageDescription="Vista semanal y mensual con detalle por día." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <CalendarSummary dailyEntries={data.dailyEntries} measurementEntries={data.measurementEntries} mode="full" />
    </DashboardShell>
  );
}
