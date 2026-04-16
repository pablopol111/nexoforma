import Link from "next/link";
import { RegisterClientForm } from "@/components/register-client-form";

export default function RegisterClientPage() {
  return (
    <main>
      <div className="container authContainer stack">
        <section className="card heroCard">
          <div className="heroGrid">
            <div className="stack">
              <span className="kicker">Alta de cliente</span>
              <h1 className="title">Registro controlado desde el nutricionista.</h1>
              <p className="subtitle">
                El cliente entra con usuario y contraseña, pero solo puede darse de alta si usa
                un token emitido desde el panel de nutricionista. Así se mantiene la relación de
                seguimiento desde el primer momento.
              </p>
            </div>
            <div className="heroPanel stack">
              <p style={{ margin: 0, fontWeight: 800 }}>Qué se valida</p>
              <div className="infoList">
                <div className="infoItem"><strong>Usuario único</strong><span>Se guarda normalizado en profiles.</span></div>
                <div className="infoItem"><strong>Email interno</strong><span>Se usa por detrás para Supabase Auth.</span></div>
                <div className="infoItem"><strong>Token de cliente</strong><span>Debe pertenecer a un nutricionista válido.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="card formCard stack">
          <div>
            <span className="badge secondary">Registro</span>
            <h2 className="title compact">Completa los datos del cliente</h2>
            <p className="subtitle">
              El token de invitación se marcará como usado cuando el alta se complete correctamente.
            </p>
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
    </main>
  );
}
