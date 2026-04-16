import Link from "next/link";
import { RegisterNutritionistForm } from "@/components/register-nutritionist-form";

export default function RegisterNutritionistPage() {
  return (
    <main>
      <div className="container authContainer stack">
        <section className="card heroCard">
          <div className="heroGrid">
            <div className="stack">
              <span className="kicker">Alta profesional</span>
              <h1 className="title">Registro de nutricionista por invitación.</h1>
              <p className="subtitle">
                El alta se apoya en un token generado desde administración. La cuenta visible se
                crea con usuario y contraseña, pero la autenticación real queda gestionada por
                Supabase Auth con email interno y contraseña segura.
              </p>
            </div>
            <div className="heroPanel stack">
              <p style={{ margin: 0, fontWeight: 800 }}>Campos del alta</p>
              <div className="infoList">
                <div className="infoItem"><strong>Usuario</strong><span>Identificador visible para el login.</span></div>
                <div className="infoItem"><strong>Clínica</strong><span>Se vincula al perfil profesional.</span></div>
                <div className="infoItem"><strong>Token</strong><span>Controla que el alta llegue desde administración.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="card formCard stack">
          <div>
            <span className="badge secondary">Registro</span>
            <h2 className="title compact">Completa los datos del profesional</h2>
            <p className="subtitle">
              El token debe estar disponible y pertenecer al tipo de invitación de nutricionista.
            </p>
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
    </main>
  );
}
