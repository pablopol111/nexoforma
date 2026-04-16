import Link from "next/link";
import { RegisterNutritionistForm } from "@/components/register-nutritionist-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterNutritionistPage() {
  return (
    <main>
      <div className="container publicPage authShell">
        <div className="publicTopbar">
          <div className="brandLockup">
            <div className="logoMark">NF</div>
            <div className="brandText">
              <strong>NexoForma</strong>
              <span>Alta profesional por invitación</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <section className="heroCard stack">
          <span className="kicker">Registro de nutricionista</span>
          <div className="authGrid">
            <div className="stack">
              <h1 className="title">Invitación controlada y presentación más sólida.</h1>
              <p className="subtitle">
                Esta alta está pensada para que el proceso sea claro y profesional: usuario visible,
                clínica, email interno, contraseña segura y token emitido desde administración.
              </p>
              <div className="notePanel">
                <span className="badge secondary">Qué valida el sistema</span>
                <div className="infoList">
                  <div className="infoItem">
                    <strong>Usuario único</strong>
                    <span>Se normaliza y se guarda en <code>profiles.username</code>.</span>
                  </div>
                  <div className="infoItem">
                    <strong>Invitación correcta</strong>
                    <span>Debe existir como <code>nutritionist_invite</code> y estar disponible.</span>
                  </div>
                  <div className="infoItem">
                    <strong>Alta real</strong>
                    <span>Se crea Auth, perfil, ficha profesional y cierre del token.</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="card authPanel stack">
              <div>
                <span className="badge">Alta profesional</span>
                <h2 className="title compact">Completa el registro</h2>
                <p className="subtitle">Cuando el alta termine, podrás iniciar sesión directamente.</p>
              </div>

              <RegisterNutritionistForm />

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
