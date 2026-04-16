import Link from "next/link";
import { RegisterClientForm } from "@/components/register-client-form";

export default function RegisterClientPage() {
  return (
    <main>
      <div className="container">
        <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 className="title">Registro de cliente</h1>
          <p className="subtitle">
            Alta controlada mediante usuario, contraseña y token generado por un
            nutricionista.
          </p>

          <div style={{ marginTop: 24 }}>
            <RegisterClientForm />
          </div>

          <div className="nav">
            <Link className="linkCard" href="/login">
              Ir al login
            </Link>
            <Link className="linkCard" href="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
