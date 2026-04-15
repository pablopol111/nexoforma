import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
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

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <main>
      <div className="container">
        <div className="card">
          <span className="badge">Admin</span>
          <h1 className="title">Panel de administración</h1>
          <p className="subtitle">
            Bienvenido, {profile.full_name || profile.username}.
          </p>

          <div className="links">
            <div className="linkCard">
              Desde aquí puedes ampliar el proyecto con gestión de tokens, altas de
              clientes y control operativo.
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
