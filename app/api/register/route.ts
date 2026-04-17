import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail, isValidPassword, isValidUsername, normalizeUsername } from "@/lib/utils";

type Payload = { username?: string; fullName?: string; clinicName?: string; email?: string; password?: string; token?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const username = normalizeUsername(body.username ?? "");
    const fullName = (body.fullName ?? "").trim();
    const clinicName = (body.clinicName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const token = (body.token ?? "").trim();
    if (!username || !fullName || !email || !password || !token) return NextResponse.json({ success: false, message: "Todos los campos son obligatorios." }, { status: 400 });
    if (!isValidUsername(username)) return NextResponse.json({ success: false, message: "Usuario no válido." }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ success: false, message: "Email no válido." }, { status: 400 });
    if (!isValidPassword(password)) return NextResponse.json({ success: false, message: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });

    const admin = createAdminClient();
    const { data: existing } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existing) return NextResponse.json({ success: false, message: "Ese usuario ya existe." }, { status: 409 });

    const { data: tokenRow } = await admin
      .from("access_tokens")
      .select("id, token_type, status, expires_at, assigned_to_nutritionist")
      .eq("token", token)
      .maybeSingle();

    if (!tokenRow) return NextResponse.json({ success: false, message: "El token no existe." }, { status: 400 });
    if (tokenRow.status !== "available") return NextResponse.json({ success: false, message: "El token no está disponible." }, { status: 400 });
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) return NextResponse.json({ success: false, message: "El token ha caducado." }, { status: 400 });

    const role = tokenRow.token_type === "nutritionist_invite" ? "nutritionist" : "client";

    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName, role },
    });
    if (authError || !created.user) return NextResponse.json({ success: false, message: authError?.message ?? "No se pudo crear el usuario." }, { status: 400 });
    const userId = created.user.id;

    const rollback = async () => {
      await admin.from("onboarding_state").delete().eq("client_user_id", userId);
      await admin.from("client_profiles").delete().eq("client_user_id", userId);
      await admin.from("clients").delete().eq("user_id", userId);
      await admin.from("nutritionists").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    };

    const { error: profileError } = await admin.from("profiles").insert({ id: userId, username, email, full_name: fullName, role, status: "active" });
    if (profileError) {
      await rollback();
      return NextResponse.json({ success: false, message: profileError.message }, { status: 400 });
    }

    if (role === "nutritionist") {
      const { error: nutritionistError } = await admin.from("nutritionists").insert({ user_id: userId, clinic_name: clinicName || "Clínica sin nombre", client_token_quota_total: 5, activated_at: new Date().toISOString() });
      if (nutritionistError) {
        await rollback();
        return NextResponse.json({ success: false, message: nutritionistError.message }, { status: 400 });
      }
      await admin.from("access_tokens").update({ status: "used", used_at: new Date().toISOString(), assigned_to_nutritionist: userId }).eq("id", tokenRow.id);
      return NextResponse.json({ success: true, message: "Cuenta de nutricionista creada." }, { status: 201 });
    }

    const { error: clientError } = await admin.from("clients").insert({ user_id: userId, nutritionist_user_id: tokenRow.assigned_to_nutritionist, blocked_by_nutritionist_status: false });
    if (clientError) {
      await rollback();
      return NextResponse.json({ success: false, message: clientError.message }, { status: 400 });
    }

    const names = fullName.split(" ");
    const firstName = names.shift() ?? fullName;
    const lastName = names.join(" ") || null;
    const { error: cpError } = await admin.from("client_profiles").insert({ client_user_id: userId, first_name: firstName, last_name: lastName });
    if (cpError) {
      await rollback();
      return NextResponse.json({ success: false, message: cpError.message }, { status: 400 });
    }

    await admin.from("onboarding_state").insert({ client_user_id: userId, first_login_started_at: new Date().toISOString(), skipped: false, profile_completed: false });
    await admin.from("access_tokens").update({ status: "used", used_at: new Date().toISOString(), assigned_to_client: userId }).eq("id", tokenRow.id);
    return NextResponse.json({ success: true, message: "Cuenta de cliente creada." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo completar el registro." }, { status: 500 });
  }
}
