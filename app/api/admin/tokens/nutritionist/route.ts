import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateAccessToken } from "@/lib/tokens";

type Payload = {
  expiresInDays?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const expiresInDays = Math.max(1, Math.min(365, Number(body.expiresInDays) || 7));

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No autenticado.",
        },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: profileData } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const profile = (profileData ?? null) as { role: string } | null;

    if (profile?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "No autorizado.",
        },
        { status: 403 }
      );
    }

    const token = generateAccessToken("NUTRI");
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await admin.from("access_tokens").insert({
      token,
      token_type: "nutritionist_invite",
      status: "available",
      created_by_user_id: user.id,
      expires_at: expiresAt,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Token de nutricionista generado correctamente:",
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "No se pudo generar el token.",
      },
      { status: 500 }
    );
  }
}
