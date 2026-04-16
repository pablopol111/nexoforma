import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail, isValidPassword, isValidUsername, normalizeUsername } from "@/lib/utils";

type RegisterPayload = {
  username?: string;
  fullName?: string;
  clinicName?: string;
  email?: string;
  password?: string;
  token?: string;
};

type TokenRow = {
  id: string;
  token: string;
  token_type: "nutritionist_invite" | "client_invite";
  status: string;
  used_at: string | null;
  expires_at: string | null;
  assigned_to_nutritionist: string | null;
  assigned_to_client: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPayload;
    const username = normalizeUsername(body.username ?? "");
    const fullName = (body.fullName ?? "").trim();
    const clinicName = (body.clinicName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const token = (body.token ?? "").trim();

    if (!username || !fullName || !email || !password || !token) {
      return NextResponse.json({ success: false, message: "Todos los campos obligatorios deben completarse." }, { status: 400 });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json({ success: false, message: "Usuario no válido." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: "Email no válido." }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json({ success: false, message: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existingUsername } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existingUsername) {
      return NextResponse.json({ success: false, message: "Ese usuario ya está en uso." }, { status: 409 });
    }

    const { data: existingEmail } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existingEmail) {
      return NextResponse.json({ success: false, message: "Ese email ya está en uso." }, { status: 409 });
    }

    const { data, error: tokenError } = await admin
      .from("access_tokens")
      .select("id, token, token_type, status, used_at, expires_at, assigned_to_nutritionist, assigned_to_client")
      .eq("token", token)
      .maybeSingle();

    const tokenRow = (data ?? null) as TokenRow | null;

    if (tokenError) {
      return NextResponse.json({ success: false, message: tokenError.message }, { status: 500 });
    }

    if (!tokenRow) {
      return NextResponse.json({ success: false, message: "El token no existe." }, { status: 400 });
    }

    if (tokenRow.status !== "available") {
      return NextResponse.json({ success: false, message: "El token no está disponible." }, { status: 400 });
    }

    if (tokenRow.used_at) {
      return NextResponse.json({ success: false, message: "El token ya ha sido utilizado." }, { status: 400 });
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, message: "El token ha caducado." }, { status: 400 });
    }

    if (tokenRow.token_type === "nutritionist_invite" && !clinicName) {
      return NextResponse.json({ success: false, message: "La clínica es obligatoria para el alta de nutricionista." }, { status: 400 });
    }

    if (tokenRow.token_type === "client_invite" && !tokenRow.assigned_to_nutritionist) {
      return NextResponse.json({ success: false, message: "El token de cliente no está vinculado a un nutricionista." }, { status: 400 });
    }

    const role = tokenRow.token_type === "nutritionist_invite" ? "nutritionist" : "client";

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
        role,
      },
    });

    if (createUserError || !createdUser.user) {
      return NextResponse.json({ success: false, message: createUserError?.message ?? "No se pudo crear el usuario." }, { status: 400 });
    }

    const userId = createdUser.user.id;

    const rollback = async () => {
      await admin.from("entries").delete().eq("client_user_id", userId);
      await admin.from("client_profiles").delete().eq("client_user_id", userId);
      await admin.from("clients").delete().eq("user_id", userId);
      await admin.from("nutritionists").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    };

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      username,
      email,
      full_name: fullName,
      role,
    });

    if (profileError) {
      await rollback();
      return NextResponse.json({ success: false, message: profileError.message }, { status: 400 });
    }

    if (role === "nutritionist") {
      const { error: nutritionistError } = await admin.from("nutritionists").insert({
        user_id: userId,
        clinic_name: clinicName,
      });

      if (nutritionistError) {
        await rollback();
        return NextResponse.json({ success: false, message: nutritionistError.message }, { status: 400 });
      }
    }

    if (role === "client") {
      const { error: clientError } = await admin.from("clients").insert({
        user_id: userId,
        nutritionist_user_id: tokenRow.assigned_to_nutritionist,
      });

      if (clientError) {
        await rollback();
        return NextResponse.json({ success: false, message: clientError.message }, { status: 400 });
      }

      const { error: clientProfileError } = await admin.from("client_profiles").insert({
        client_user_id: userId,
      });

      if (clientProfileError) {
        await rollback();
        return NextResponse.json({ success: false, message: clientProfileError.message }, { status: 400 });
      }
    }

    const tokenUpdate: Record<string, string> = {
      status: "used",
      used_at: new Date().toISOString(),
    };

    if (role === "nutritionist") {
      tokenUpdate.assigned_to_nutritionist = userId;
    } else {
      tokenUpdate.assigned_to_client = userId;
    }

    const { error: tokenUpdateError } = await admin.from("access_tokens").update(tokenUpdate).eq("id", tokenRow.id);

    if (tokenUpdateError) {
      await rollback();
      return NextResponse.json({ success: false, message: tokenUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: role === "nutritionist" ? "Cuenta de nutricionista creada." : "Cuenta de cliente creada.",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "No se pudo completar el registro.",
    }, { status: 500 });
  }
}