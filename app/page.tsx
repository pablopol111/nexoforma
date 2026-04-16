import Link from "next/link";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { ROLE_DASHBOARD } from "@/lib/constants";
import { LogoutButton } from "@/components/logout-button";

export default async function HomePage() {
  const session = await getCurrentUserWithProfile();

  return (
    <main>
      <div className="container">
        <div className="card">
          <span className="badge">NexoForma</span>
          <h1 className="title">Plataforma de control de peso</h1>
          <p className="subtitle">
            Proyecto limpio en Next.js + TypeScript + Supabase, con autenticación real,
            roles y flujos por token.
          </p>

          {session ? (
            <div className="stack" style={{ marginTop: 24 }}>
              <p>
                Sesión activa como <strong>{session.profile.full_name}</strong> ({session.profile.role})
              </p>
              <div className="nav">
                <Link className="linkCard" href={ROLE_DASHBOARD[session.profile.role]}>
                  Ir a mi panel
                </Link>
                <LogoutButton />
              </div>
            </div>
          ) : (
            <div className="nav">
              <Link className="linkCard" href="/login">
                Iniciar sesión
              </Link>
              <Link className="linkCard" href="/register/nutritionist">
                Registro de nutricionista
              </Link>
              <Link className="linkCard" href="/register/client">
                Registro de cliente
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
