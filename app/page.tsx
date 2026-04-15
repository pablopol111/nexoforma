import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <div className="container grid grid-2">
        <section className="card stack">
          <h1 className="title">NexoForma Platform</h1>
          <p className="subtitle">
            Base nueva del producto con autenticación, base de datos y separación de roles.
          </p>
          <div className="stack">
            <Link className="button" href="/login">Entrar</Link>
            <Link className="button secondary" href="/admin">Vista admin</Link>
            <Link className="button secondary" href="/nutritionist">Vista nutricionista</Link>
            <Link className="button secondary" href="/client">Vista cliente</Link>
          </div>
        </section>

        <section className="card stack">
          <h2>Qué haremos ahora</h2>
          <p className="muted">1. Conectar Supabase</p>
          <p className="muted">2. Ejecutar esquema SQL</p>
          <p className="muted">3. Activar autenticación y roles</p>
          <p className="muted">4. Conectar panel admin, nutricionista y cliente a datos reales</p>
        </section>
      </div>
    </main>
  );
}
