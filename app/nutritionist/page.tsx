import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NutritionistPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "nutritionist") {
    redirect("/");
  }

  return (
    <main>
      <div className="container">
        <div className="card">
          <span className="badge">Nutritionist</span>
          <h1 className="title">Panel del nutricionista</h1>
          <p className="subtitle">
            Bienvenido, {profile.full_name || profile.username}.
          </p>

          <div className="links">
            <div className="linkCard">
              Esta pantalla queda preparada como base para clientes, seguimiento y
              planes nutricionales.
            </div>
            <Link className="linkCard" href="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
