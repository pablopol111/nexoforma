import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <main>
      <div className="container publicPage authShell">
        <div className="publicTopbar">
          <div className="brandLockup">
            <div className="logoMark">NF</div>
            <div className="brandText">
              <strong>NexoForma</strong>
              <span>Acceso por perfil con experiencia cuidada</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <section className="heroCard stack">
          <span className="kicker">Acceso</span>
          <div className="authGrid">
            <div className="stack">
              <h1 className="title">Elige tu perfil y entra con una experiencia más clara.</h1>
              <p className="subtitle">
                La pantalla de login vuelve a tener jerarquía visual: bloques limpios, contraste
                alto y decisión explícita de si el acceso es de nutricionista o de cliente. El rol
                visible se valida después contra el perfil real guardado en la base de datos.
              </p>
              <div className="notePanel">
                <span className="badge secondary">Cómo funciona</span>
                <div className="infoList">
                  <div className="infoItem">
                    <strong>Visible</strong>
                    <span>Usuario y contraseña con selector de perfil.</span>
                  </div>
                  <div className="infoItem">
                    <strong>Interno</strong>
                    <span>Resolución username a email antes del sign in real.</span>
                  </div>
                  <div className="infoItem">
                    <strong>Seguridad</strong>
                    <span>Supabase Auth gestiona la autenticación, sin MD5.</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="card authPanel stack">
              <div>
                <span className="badge">Inicio de sesión</span>
                <h2 className="title compact">Accede a tu panel</h2>
                <p className="subtitle">
                  Si tu usuario no coincide con el perfil seleccionado, el sistema lo bloqueará con
                  un mensaje claro.
                </p>
              </div>

              <LoginForm />

              <div className="nav">
                <Link className="linkCard" href="/register/nutritionist">
                  Alta nutricionista
                </Link>
                <Link className="linkCard" href="/register/client">
                  Alta cliente
                </Link>
                <Link className="linkCard" href="/">
                  Volver al inicio
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
