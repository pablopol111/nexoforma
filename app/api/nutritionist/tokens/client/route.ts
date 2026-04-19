import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { generateAccessToken } from "@/lib/tokens";

const expiresInDays = 60;

async function getCurrentUser() {
  const response = NextResponse.json({ success: true });
  const supabase = await createRouteHandlerClient(response);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function buildPayload(userId: string) {
  const admin = createAdminClient();
  const { data: nutritionist } = await admin.from("nutritionists").select("client_token_quota_total").eq("user_id", userId).maybeSingle();
  const { count: activeClients } = await admin.from("clients").select("user_id", { head: true, count: "exact" }).eq("nutritionist_user_id", userId);
  const { count: availableTokens } = await admin.from("access_tokens").select("id", { head: true, count: "exact" }).eq("token_type", "client_invite").eq("created_by_user_id", userId).eq("status", "available");
  const { data: tokens } = await admin.from("access_tokens").select("id, token, status, created_at, used_at, expires_at").eq("token_type", "client_invite").eq("created_by_user_id", userId).order("created_at", { ascending: false });
  const quota = (nutritionist as { client_token_quota_total?: number } | null)?.client_token_quota_total ?? 0;
  const remainingSlots = Math.max(0, quota - ((activeClients ?? 0) + (availableTokens ?? 0)));
  return { tokens: tokens ?? [], remainingSlots };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "No autenticado." }, { status: 401 });
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || (profile as { role?: string }).role !== "nutritionist") return NextResponse.json({ success: false, message: "No autorizado." }, { status: 403 });
    return NextResponse.json({ success: true, ...(await buildPayload(user.id)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo consultar el histórico." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "No autenticado." }, { status: 401 });
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || (profile as { role?: string }).role !== "nutritionist") return NextResponse.json({ success: false, message: "No autorizado." }, { status: 403 });
    const payload = await buildPayload(user.id);
    if (payload.remainingSlots <= 0) return NextResponse.json({ success: false, message: "Has alcanzado tu cupo total de clientes." }, { status: 400 });
    const token = generateAccessToken("CLIENT");
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
    const { error } = await admin.from("access_tokens").insert({ token, token_type: "client_invite", status: "available", created_by_user_id: user.id, assigned_to_nutritionist: user.id, expires_at: expiresAt });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: "Token generado correctamente.", token, ...(await buildPayload(user.id)) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "No se pudo generar el token." }, { status: 500 });
  }
}
