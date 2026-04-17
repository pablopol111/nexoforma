import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateAccessToken } from "@/lib/tokens";

type Payload = { expiresInDays?: number };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const expiresInDays = Math.max(1, Math.min(365, Number(body.expiresInDays) || 7));
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "No autenticado." }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role, status").eq("id", user.id).maybeSingle();
    if (!profile || (profile as { role?: string }).role !== "nutritionist") return NextResponse.json({ success: false, message: "No autorizado." }, { status: 403 });

    const { data: nutritionist } = await admin.from("nutritionists").select("client_token_quota_total").eq("user_id", user.id).maybeSingle();
    const { count: activeTokens } = await admin
      .from("access_tokens")
      .select("id", { head: true, count: "exact" })
      .eq("token_type", "client_invite")
      .eq("created_by_user_id", user.id)
      .in("status", ["available", "used"]);
    const quota = (nutritionist as { client_token_quota_total?: number } | null)?.client_token_quota_total ?? 0;
    if ((activeTokens ?? 0) >= quota) return NextResponse.json({ success: false, message: "Has alcanzado tu cupo total de clientes." }, { status: 400 });

    const token = generateAccessToken("CLIENT");
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
    const { error } = await admin.from("access_tokens").insert({ token, token_type: "client_invite", status: "available", created_by_user_id: user.id, assigned_to_nutritionist: user.id, expires_at: expiresAt });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: "Token generado.", token }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo generar el token." }, { status: 500 });
  }
}
