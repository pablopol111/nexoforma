import Link from "next/link";
import { RegisterClientForm } from "@/components/register-client-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterClientPage() {
  return (
    <main>
      <div className="container publicPage authShell">
        <div className="publicTopbar">
          <div className="brandLockup">
            <div className="logoMark">NF</div>
            <div className="brandText">
              <strong>NexoForma</strong>
              <span>Alta de cliente vinculada al nutricionista</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <section className="heroCard stack">
          <span className="kicker">Registro de cliente</span>
          <div className="authGrid">
            <div className="stack">
              <h1 className="title">Un registro limpio, guiado y ya conectado al seguimiento.</h1>
              <p className="subtitle">
                El cliente entra con usuario y contraseña, pero el alta solo se completa si el token
                procede de un nutricionista válido. Así se mantiene la relación desde el primer acceso.
              </p>
              <div className="notePanel">
                <span className="badge secondary">Qué valida el sistema</span>
                <div className="infoList">
                  <div className="infoItem">
                    <strong>Identidad</strong>
                    <span>Usuario visible, email interno y contraseña segura.</span>
                  </div>
                  <div className="infoItem">
                    <strong>Token cliente</strong>
                    <span>Debe ser <code>client_invite</code>, disponible y vinculado a un profesional.</span>
                  </div>
                  <div className="infoItem">
                    <strong>Relación automática</strong>
                    <span>Se crea perfil, cliente y ficha inicial dentro de la cartera correcta.</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="card authPanel stack">
              <div>
                <span className="badge">Alta de cliente</span>
                <h2 className="title compact">Completa el registro</h2>
                <p className="subtitle">Al terminar, ya podrás iniciar sesión como cliente.</p>
              </div>

              <RegisterClientForm />

              <div className="nav">
                <Link className="linkCard" href="/login">
                  Ir al login
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
