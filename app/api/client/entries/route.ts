import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  entryDate?: string;
  weightKg?: number;
  steps?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const entryDate = (body.entryDate ?? "").trim();
    const weightKg = Number(body.weightKg);
    const steps = Number(body.steps);

    if (!entryDate || Number.isNaN(weightKg) || Number.isNaN(steps)) {
      return NextResponse.json({ success: false, message: "Fecha, peso y pasos son obligatorios." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "No autenticado." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();

    if (!profile || profile.role !== "client") {
      return NextResponse.json({ success: false, message: "No autorizado." }, { status: 403 });
    }

    const { error } = await admin.from("entries").upsert({
      client_user_id: user.id,
      recorded_by_user_id: user.id,
      entry_date: entryDate,
      weight_kg: weightKg,
      steps,
    }, {
      onConflict: "client_user_id,entry_date",
    });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Registro guardado." });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "No se pudo guardar el registro.",
    }, { status: 500 });
  }
}