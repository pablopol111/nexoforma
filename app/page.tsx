import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <div className="card">
          <span className="badge">Arquitectura nueva</span>
          <h1 className="title">NexoForma</h1>
          <p className="subtitle">
            Base limpia para GitHub con Next.js, TypeScript, Supabase y rutas por rol.
          </p>

          <div className="links">
            <Link className="linkCard" href="/login">
              Acceder al sistema
            </Link>
            <Link className="linkCard" href="/register/nutritionist">
              Registrar nutricionista con token
            </Link>
            <Link className="linkCard" href="/admin">
              Panel admin
            </Link>
            <Link className="linkCard" href="/nutritionist">
              Panel nutricionista
            </Link>
            <Link className="linkCard" href="/client">
              Panel cliente
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
