import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  heightCm?: number | null;
  referenceWeightKg?: number | null;
  targetWeightKg?: number | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
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

    const { error } = await admin.from("client_profiles").upsert({
      client_user_id: user.id,
      height_cm: body.heightCm ?? null,
      reference_weight_kg: body.referenceWeightKg ?? null,
      target_weight_kg: body.targetWeightKg ?? null,
    });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Perfil guardado." });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "No se pudo guardar el perfil.",
    }, { status: 500 });
  }
}