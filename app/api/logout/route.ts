import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada.",
  });

  const supabase = await createRouteHandlerClient(response);
  await supabase.auth.signOut();

  return response;
}
