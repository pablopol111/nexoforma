import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main>
      <div className="container authContainer stack">
        <section className="card heroCard">
          <div className="heroGrid">
            <div className="stack">
              <span className="kicker">NexoForma 1.0.1</span>
              <h1 className="title">Acceso elegante, claro y separado por perfil.</h1>
              <p className="subtitle">
                El login vuelve a la estructura visual principal y ahora pregunta de forma
                explícita si el acceso es de nutricionista o de cliente. Internamente el
                sistema sigue autenticando con email y contraseña mediante Supabase Auth.
              </p>
              <div className="buttonRow">
                <Link className="linkCard primary" href="/register/nutritionist">
                  Alta de nutricionista
                </Link>
                <Link className="linkCard primary" href="/register/client">
                  Alta de cliente
                </Link>
              </div>
            </div>

            <div className="heroPanel stack">
              <p style={{ margin: 0, fontWeight: 800 }}>Qué hace el acceso</p>
              <div className="infoList">
                <div className="infoItem">
                  <strong>Visible</strong>
                  <span>Usuario y contraseña con elección del perfil.</span>
                </div>
                <div className="infoItem">
                  <strong>Interno</strong>
                  <span>Resolución de username a email antes del login real.</span>
                </div>
                <div className="infoItem">
                  <strong>Seguro</strong>
                  <span>Supabase Auth gestiona la contraseña, sin MD5 ni localStorage.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card formCard stack">
          <div>
            <span className="badge secondary">Inicio de sesión</span>
            <h2 className="title compact">Entra con el perfil correcto</h2>
            <p className="subtitle">
              El rol seleccionado en pantalla se comprueba contra tu perfil real antes de
              redirigirte al panel correspondiente.
            </p>
          </div>

          <LoginForm />

          <div className="nav">
            <Link className="linkCard" href="/register/nutritionist">
              Registro de nutricionista
            </Link>
            <Link className="linkCard" href="/register/client">
              Registro de cliente
            </Link>
            <Link className="linkCard" href="/">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
