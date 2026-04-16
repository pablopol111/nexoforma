import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUserWithProfile } from "@/lib/auth";
import { ROLE_DASHBOARD } from "@/lib/constants";

export default async function HomePage() {
  const session = await getCurrentUserWithProfile();

  return (
    <main>
      <div className="container publicPage authShell">
        <div className="publicTopbar">
          <div className="brandLockup">
            <div className="logoMark">NF</div>
            <div className="brandText">
              <strong>NexoForma</strong>
              <span>Control de peso, roles separados y seguimiento visual</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <section className="heroCard stack">
          <span className="kicker">Versión dashboard</span>
          <div className="heroGrid">
            <div className="stack">
              <h1 className="title">Una interfaz más premium, clara y útil para trabajar cada día.</h1>
              <p className="subtitle">
                La base técnica ya está limpia con Next.js y Supabase. Esta versión vuelve a poner
                el foco en la presentación: panel lateral, bloques de resumen, contraste legible,
                modo oscuro y modo claro, y gráficas de progreso que se reescalan según el valor real.
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
                    <Link className="linkCard" href="/register/nutritionist">
                      Alta nutricionista
                    </Link>
                    <Link className="linkCard" href="/register/client">
                      Alta cliente
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="heroPanel stack">
              <div>
                <span className="badge secondary">Qué incluye</span>
              </div>
              <div className="heroChecklist">
                <div className="heroChecklistItem">
                  <div>
                    <strong>Login visible por usuario y contraseña</strong>
                    <p className="subtitle">Resolución interna de username a email con Supabase Auth.</p>
                  </div>
                </div>
                <div className="heroChecklistItem">
                  <div>
                    <strong>Invitaciones controladas por token</strong>
                    <p className="subtitle">Alta de nutricionista y cliente con separación de roles real.</p>
                  </div>
                </div>
                <div className="heroChecklistItem">
                  <div>
                    <strong>Dashboard inspirado en interfaz profesional</strong>
                    <p className="subtitle">Sidebar, tarjetas, tablas y gráficas mejor presentadas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="publicStats">
          <article className="statCard">
            <p className="statLabel">Admin</p>
            <p className="statValue">Tokens</p>
            <p className="statHint">Genera accesos de nutricionista y controla el estado general.</p>
          </article>
          <article className="statCard">
            <p className="statLabel">Nutricionista</p>
            <p className="statValue">Clientes</p>
            <p className="statHint">Gestiona altas, seguimiento y base activa de pacientes.</p>
          </article>
          <article className="statCard">
            <p className="statLabel">Cliente</p>
            <p className="statValue">Progreso</p>
            <p className="statHint">Consulta evolución, histórico y métricas visuales reescaladas.</p>
          </article>
        </section>

        <section className="surfaceBand stack">
          <div className="surfaceBandHeader">
            <div>
              <span className="badge">Accesos rápidos</span>
              <h2 className="title compact">Puntos de entrada del sistema</h2>
              <p className="subtitle">
                Todo está preparado para trabajar solo sobre el proyecto nuevo. Nada depende de la
                app antigua con localStorage.
              </p>
            </div>
          </div>

          <div className="nav">
            <Link className="linkCard" href="/login">
              Login
            </Link>
            <Link className="linkCard" href="/register/nutritionist">
              Registro de nutricionista
            </Link>
            <Link className="linkCard" href="/register/client">
              Registro de cliente
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
