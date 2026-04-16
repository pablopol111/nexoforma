import { NextResponse } from "next/server";
import { ROLE_DASHBOARD } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/utils";

type LoginRole = "admin" | "nutritionist" | "client";

type LoginPayload = {
  username?: string;
  password?: string;
  next?: string | null;
  selectedRole?: LoginRole;
};

type ProfileLookup = {
  email: string;
  role: LoginRole;
};

const ROLE_LABEL: Record<LoginRole, string> = {
  admin: "administración",
  nutritionist: "nutricionista",
  client: "cliente",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload;
    const username = normalizeUsername(body.username ?? "");
    const password = body.password ?? "";
    const selectedRole = body.selectedRole;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario y contraseña son obligatorios.",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error: profileError } = await admin
      .from("profiles")
      .select("email, role")
      .eq("username", username)
      .maybeSingle();

    const profile = (data ?? null) as ProfileLookup | null;

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo validar el usuario.",
        },
        { status: 500 }
      );
    }

    if (!profile?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciales inválidas.",
        },
        { status: 401 }
      );
    }

    if (selectedRole && profile.role !== selectedRole) {
      return NextResponse.json(
        {
          success: false,
          message: `Este usuario pertenece al perfil ${ROLE_LABEL[profile.role]}. Selecciona el acceso correcto.`,
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Inicio de sesión correcto.",
      redirectTo:
        body.next && body.next.startsWith("/") ? body.next : ROLE_DASHBOARD[profile.role] ?? "/",
    });

    const supabase = await createRouteHandlerClient(response);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciales inválidas.",
        },
        { status: 401 }
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "No se pudo iniciar sesión.",
      },
      { status: 500 }
    );
  }
}
