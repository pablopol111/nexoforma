import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeUsername, usernameToEmail } from "@/lib/auth";

type RegisterPayload = {
  fullName?: string;
  username?: string;
  password?: string;
  accessToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPayload;
    const fullName = body.fullName?.trim();
    const username = normalizeUsername(body.username || "");
    const password = body.password?.trim() || "";
    const accessToken = body.accessToken?.trim() || "";

    if (!fullName || !username || !password || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos los campos son obligatorios."
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan variables de entorno del servidor."
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Ese usuario ya existe."
        },
        { status: 409 }
      );
    }

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("access_tokens")
      .select("id, code, role, active, used_at")
      .eq("code", accessToken)
      .eq("role", "nutritionist")
      .eq("active", true)
      .maybeSingle();

    if (tokenError) {
      return NextResponse.json(
        {
          success: false,
          message: tokenError.message
        },
        { status: 400 }
      );
    }

    if (!tokenRow || tokenRow.used_at) {
      return NextResponse.json(
        {
          success: false,
          message: "El token no es válido o ya fue utilizado."
        },
        { status: 400 }
      );
    }

    const email = usernameToEmail(username);

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          full_name: fullName,
          role: "nutritionist"
        }
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          success: false,
          message: createUserError?.message || "No se pudo crear el usuario."
        },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      username,
      full_name: fullName,
      role: "nutritionist"
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          success: false,
          message: profileError.message
        },
        { status: 400 }
      );
    }

    const { error: tokenUpdateError } = await supabaseAdmin
      .from("access_tokens")
      .update({
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq("id", tokenRow.id);

    if (tokenUpdateError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Usuario creado, pero no se pudo cerrar correctamente el token. Revisa la base de datos."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registro completado. Ya puedes iniciar sesión."
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error inesperado."
      },
      { status: 500 }
    );
  }
}
