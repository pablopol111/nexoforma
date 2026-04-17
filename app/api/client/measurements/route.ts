import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  entryDate?: string;
  weightKg?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  thighRelaxedCm?: number | null;
  bicepsNormalCm?: number | null;
  bicepsFlexedCm?: number | null;
  chestCm?: number | null;
  comment?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const entryDate = (body.entryDate ?? "").trim();
    if (!entryDate) return NextResponse.json({ success: false, message: "La fecha es obligatoria." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "No autenticado." }, { status: 401 });

    const admin = createAdminClient();
    const payload = {
      client_user_id: user.id,
      entry_date: entryDate,
      weight_kg: body.weightKg ?? null,
      waist_cm: body.waistCm ?? null,
      hip_cm: body.hipCm ?? null,
      thigh_relaxed_cm: body.thighRelaxedCm ?? null,
      biceps_normal_cm: body.bicepsNormalCm ?? null,
      biceps_flexed_cm: body.bicepsFlexedCm ?? null,
      chest_cm: body.chestCm ?? null,
      comment: (body.comment ?? "").trim() || null,
    };

    const { data: existing } = await admin.from("measurement_entries").select("id").eq("client_user_id", user.id).eq("entry_date", entryDate).maybeSingle();
    if (existing) {
      const { error } = await admin.from("measurement_entries").update(payload).eq("id", (existing as { id: string }).id);
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    } else {
      const { error } = await admin.from("measurement_entries").insert(payload);
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    await admin
      .from("measurement_requests")
      .update({ measurements_status: "completed", measurements_completed_at: new Date().toISOString() })
      .eq("client_user_id", user.id)
      .eq("measurements_status", "pending")
      .lte("requested_at", new Date(`${entryDate}T23:59:59.000Z`).toISOString());

    return NextResponse.json({ success: true, message: existing ? "Medidas actualizadas." : "Medidas guardadas." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo guardar." }, { status: 500 });
  }
}
