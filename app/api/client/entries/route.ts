import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Payload = { entryDate?: string; weightKg?: number; steps?: number; comment?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const entryDate = (body.entryDate ?? "").trim();
    const weightKg = Number(body.weightKg);
    const steps = Number(body.steps);
    const comment = (body.comment ?? "").trim() || null;
    if (!entryDate || Number.isNaN(weightKg) || Number.isNaN(steps)) return NextResponse.json({ success: false, message: "Fecha, peso y pasos son obligatorios." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "No autenticado." }, { status: 401 });

    const admin = createAdminClient();
    const { data: existing } = await admin.from("daily_entries").select("id").eq("client_user_id", user.id).eq("entry_date", entryDate).maybeSingle();

    if (existing) {
      const { error } = await admin.from("daily_entries").update({ weight_kg: weightKg, steps, comment }).eq("id", (existing as { id: string }).id);
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    } else {
      const { error } = await admin.from("daily_entries").insert({ client_user_id: user.id, entry_date: entryDate, weight_kg: weightKg, steps, comment });
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    await admin
      .from("measurement_requests")
      .update({ weight_status: "completed", weight_completed_at: new Date().toISOString() })
      .eq("client_user_id", user.id)
      .eq("weight_status", "pending")
      .lte("requested_at", new Date(`${entryDate}T23:59:59.000Z`).toISOString());

    return NextResponse.json({ success: true, message: existing ? "Registro actualizado." : "Registro guardado." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo guardar el registro." }, { status: 500 });
  }
}
