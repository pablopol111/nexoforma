import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main>
      <div className="container">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 className="title">Iniciar sesión</h1>
          <p className="subtitle">
            El usuario introduce usuario y contraseña. Internamente el sistema resuelve
            username a email y autentica con Supabase Auth.
          </p>

          <div style={{ marginTop: 24 }}>
            <LoginForm />
          </div>

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
        </div>
      </div>
    </main>
  );
}
