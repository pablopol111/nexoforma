import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { getClientDashboardData } from "@/lib/client-data";
import { ClientProfileEditor } from "@/components/client-profile-editor";

export default async function ClientProfilePage() {
  const session = await requireRole("client");
  const data = await getClientDashboardData(session.profile.id);
  return (
    <DashboardShell role="client" activeHref="/client/profile" pageTitle="Perfil" pageDescription="Datos base del cliente y objetivos." profileName={session.profile.full_name} profileSubtext={session.profile.email}>
      <ClientProfileEditor
        initialFirstName={data.clientProfile?.first_name ?? null}
        initialLastName={data.clientProfile?.last_name ?? null}
        initialAge={data.clientProfile?.age ?? null}
        initialSex={data.clientProfile?.sex ?? null}
        initialHeightCm={data.clientProfile?.height_cm ?? null}
        initialReferenceWeightKg={data.clientProfile?.reference_weight_kg ?? null}
        initialTargetWeightKg={data.clientProfile?.target_weight_kg ?? null}
      />
    </DashboardShell>
  );
}
