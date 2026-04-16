import Link from "next/link";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { ROLE_DASHBOARD } from "@/lib/constants";
import { LogoutButton } from "@/components/logout-button";

export default async function HomePage() {
  const session = await getCurrentUserWithProfile();

  return (
    <main>
      <div className="container stack">
        <section className="card heroCard">
          <div className="heroGrid">
            <div className="stack">
              <span className="kicker">NexoForma 1.0.1</span>
              <h1 className="title">Control de peso con una presentación limpia y profesional.</h1>
              <p className="subtitle">
                Base nueva en Next.js y Supabase, con roles separados, tokens de invitación,
                login por usuario y una experiencia visual más cuidada y coherente con la idea
                original del proyecto.
              </p>
              <div className="buttonRow">
                {session ? (
                  <>
                    <Link className="linkCard primary" href={ROLE_DASHBOARD[session.profile.role]}>
                      Ir a mi panel
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link className="linkCard primary" href="/login">
                      Iniciar sesión
                    </Link>
                    <Link className="linkCard primary" href="/register/nutritionist">
                      Alta nutricionista
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="heroPanel stack">
              <p style={{ margin: 0, fontWeight: 800 }}>Arquitectura actual</p>
              <div className="infoList">
                <div className="infoItem">
                  <strong>Autenticación real</strong>
                  <span>Supabase Auth con resolución interna username a email.</span>
                </div>
                <div className="infoItem">
                  <strong>Acceso por invitación</strong>
                  <span>Tokens diferenciados para nutricionista y cliente.</span>
                </div>
                <div className="infoItem">
                  <strong>Seguimiento visual</strong>
                  <span>Gráficas reescalables para interpretar mejor la evolución.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid cols-3">
          <div className="statCard">
            <p className="statLabel">Administrador</p>
            <p className="statValue">Tokens</p>
            <p className="statHint">Genera invitaciones de nutricionista y controla altas.</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Nutricionista</p>
            <p className="statValue">Pacientes</p>
            <p className="statHint">Gestiona acceso de clientes y seguimiento de la cartera.</p>
          </div>
          <div className="statCard">
            <p className="statLabel">Cliente</p>
            <p className="statValue">Progreso</p>
            <p className="statHint">Consulta la evolución visual y el histórico de registros.</p>
          </div>
        </section>

        <section className="card">
          <div className="panelHeader">
            <div>
              <span className="badge">Accesos</span>
              <h2 className="title compact">Entradas principales</h2>
              <p className="subtitle">
                Usa solo el proyecto nuevo. No reutilices la versión antigua con localStorage.
              </p>
            </div>
          </div>
          <div className="nav" style={{ marginTop: 18 }}>
            <Link className="linkCard" href="/login">
              Login
            </Link>
            <Link className="linkCard" href="/register/nutritionist">
              Registro nutricionista
            </Link>
            <Link className="linkCard" href="/register/client">
              Registro cliente
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
