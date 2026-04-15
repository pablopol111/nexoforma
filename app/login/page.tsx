export default function LoginPage() {
  return (
    <main className="page">
      <div className="container">
        <section className="card stack" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 className="title">Acceso a NexoForma</h1>
          <p className="subtitle">
            Esta pantalla quedará conectada a autenticación real con Supabase en el siguiente paso.
          </p>
          <div className="stack">
            <label>Correo electrónico</label>
            <input className="input" placeholder="usuario@dominio.com" />
            <label>Contraseña o token temporal</label>
            <input className="input" placeholder="••••••••" />
            <button className="button">Entrar</button>
          </div>
        </section>
      </div>
    </main>
  );
}
