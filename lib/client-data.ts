import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientProfileRecord, DailyEntryRecord, MeasurementEntryRecord, ProfileRecord } from "@/lib/types";

export type ClientDashboardData = {
  clientProfile: ClientProfileRecord | null;
  clientLink: { user_id: string; nutritionist_user_id: string } | null;
  dailyEntries: DailyEntryRecord[];
  measurementEntries: MeasurementEntryRecord[];
  requests: { id: string; requested_at: string; weight_status: string; measurements_status: string }[];
  nutritionistProfile: Pick<ProfileRecord, "full_name" | "email"> | null;
};

export async function getClientDashboardData(clientUserId: string): Promise<ClientDashboardData> {
  const admin = createAdminClient();
  const [{ data: clientProfile }, { data: client }, { data: dailyEntries }, { data: measurementEntries }, { data: requests }] = await Promise.all([
    admin.from("client_profiles").select("*").eq("client_user_id", clientUserId).maybeSingle(),
    admin.from("clients").select("user_id, nutritionist_user_id").eq("user_id", clientUserId).maybeSingle(),
    admin.from("daily_entries").select("*").eq("client_user_id", clientUserId).order("entry_date", { ascending: true }),
    admin.from("measurement_entries").select("*").eq("client_user_id", clientUserId).order("entry_date", { ascending: false }),
    admin.from("measurement_requests").select("id, requested_at, weight_status, measurements_status").eq("client_user_id", clientUserId).or("weight_status.eq.pending,measurements_status.eq.pending").order("requested_at", { ascending: false }),
  ]);

  let nutritionistProfile = null;
  if (client?.nutritionist_user_id) {
    const { data } = await admin.from("profiles").select("full_name, email").eq("id", client.nutritionist_user_id).maybeSingle();
    nutritionistProfile = (data as Pick<ProfileRecord, "full_name" | "email"> | null) ?? null;
  }

  return {
    clientProfile: (clientProfile as ClientProfileRecord | null) ?? null,
    clientLink: (client as { user_id: string; nutritionist_user_id: string } | null) ?? null,
    dailyEntries: (dailyEntries as DailyEntryRecord[] | null) ?? [],
    measurementEntries: (measurementEntries as MeasurementEntryRecord[] | null) ?? [],
    requests: (requests as { id: string; requested_at: string; weight_status: string; measurements_status: string }[] | null) ?? [],
    nutritionistProfile,
  };
}
