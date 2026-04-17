import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  sex?: "male" | "female" | null;
  heightCm?: number | null;
  referenceWeightKg?: number | null;
  targetWeightKg?: number | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "No autenticado." }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || (profile as { role?: string }).role !== "client") return NextResponse.json({ success: false, message: "No autorizado." }, { status: 403 });

    const profileCompleted = Boolean(body.firstName?.trim() && body.lastName?.trim() && body.age && body.sex && body.referenceWeightKg && body.heightCm);

    const { error } = await admin.from("client_profiles").upsert({
      client_user_id: user.id,
      first_name: body.firstName?.trim() || null,
      last_name: body.lastName?.trim() || null,
      age: body.age ?? null,
      sex: body.sex ?? null,
      height_cm: body.heightCm ?? null,
      reference_weight_kg: body.referenceWeightKg ?? null,
      target_weight_kg: body.targetWeightKg ?? null,
      profile_completed_at: profileCompleted ? new Date().toISOString() : null,
    });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });

    await admin.from("profiles").update({ full_name: [body.firstName, body.lastName].filter(Boolean).join(" ").trim() || "Cliente" }).eq("id", user.id);
    await admin.from("onboarding_state").upsert({ client_user_id: user.id, profile_completed: profileCompleted, completed_at: profileCompleted ? new Date().toISOString() : null });

    return NextResponse.json({ success: true, message: profileCompleted ? "Perfil listo, ya puedes registrar medidas." : "Perfil guardado.", profileCompleted });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo guardar el perfil." }, { status: 500 });
  }
}
