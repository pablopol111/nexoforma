import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
} from "@/lib/utils";

type RegisterClientPayload = {
  username?: string;
  fullName?: string;
  email?: string;
  password?: string;
  token?: string;
};

type AccessTokenRow = {
  id: string;
  token: string;
  token_type: string;
  status: string;
  used_at: string | null;
  expires_at: string | null;
  assigned_to_client: string | null;
  assigned_to_nutritionist: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterClientPayload;

    const username = normalizeUsername(body.username ?? "");
    const fullName = (body.fullName ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const token = (body.token ?? "").trim();

    if (!username || !fullName || !email || !password || !token) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos los campos son obligatorios.",
        },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "El usuario debe tener entre 3 y 30 caracteres y solo puede incluir letras minúsculas, números, punto, guion o guion bajo.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "El email no tiene un formato válido.",
        },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          message: "La contraseña debe tener al menos 8 caracteres.",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: existingUsername } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "Ese nombre de usuario ya está en uso.",
        },
        { status: 409 }
      );
    }

    const { data: existingEmail } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Ese email ya está en uso.",
        },
        { status: 409 }
      );
    }

    const { data, error: tokenError } = await admin
      .from("access_tokens")
      .select(
        "id, token, token_type, status, used_at, expires_at, assigned_to_client, assigned_to_nutritionist"
      )
      .eq("token", token)
      .eq("token_type", "client_invite")
      .maybeSingle();

    const tokenRow = (data ?? null) as AccessTokenRow | null;

    if (tokenError) {
      return NextResponse.json(
        {
          success: false,
          message: tokenError.message,
        },
        { status: 500 }
      );
    }

    if (!tokenRow) {
      return NextResponse.json(
        {
          success: false,
          message: "El token no existe o no corresponde a un cliente.",
        },
        { status: 400 }
      );
    }

    if (tokenRow.status !== "available") {
      return NextResponse.json(
        {
          success: false,
          message: "El token no está disponible.",
        },
        { status: 400 }
      );
    }

    if (tokenRow.used_at || tokenRow.assigned_to_client) {
      return NextResponse.json(
        {
          success: false,
          message: "El token ya ha sido utilizado.",
        },
        { status: 400 }
      );
    }

    if (!tokenRow.assigned_to_nutritionist) {
      return NextResponse.json(
        {
          success: false,
          message: "El token no está vinculado a ningún nutricionista.",
        },
        { status: 400 }
      );
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: "El token ha caducado.",
        },
        { status: 400 }
      );
    }

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
        role: "client",
      },
    });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          success: false,
          message: createUserError?.message ?? "No se pudo crear el usuario en Auth.",
        },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      username,
      email,
      full_name: fullName,
      role: "client",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          success: false,
          message: profileError.message,
        },
        { status: 400 }
      );
    }

    const { error: clientError } = await admin.from("clients").insert({
      user_id: userId,
      nutritionist_user_id: tokenRow.assigned_to_nutritionist,
    });

    if (clientError) {
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          success: false,
          message: clientError.message,
        },
        { status: 400 }
      );
    }

    const { error: clientProfileError } = await admin.from("client_profiles").insert({
      client_user_id: userId,
    });

    if (clientProfileError) {
      await admin.from("clients").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          success: false,
          message: clientProfileError.message,
        },
        { status: 400 }
      );
    }

    const { error: tokenUpdateError } = await admin
      .from("access_tokens")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
        assigned_to_client: userId,
      })
      .eq("id", tokenRow.id);

    if (tokenUpdateError) {
      await admin.from("client_profiles").delete().eq("client_user_id", userId);
      await admin.from("clients").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo completar el cierre del token. Se ha revertido el alta.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cliente registrado correctamente. Ya puede iniciar sesión.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Se produjo un error inesperado.",
      },
      { status: 500 }
    );
  }
}
