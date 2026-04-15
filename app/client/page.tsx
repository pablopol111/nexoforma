export default function ClientPage() {
  return (
    <main className="page">
      <div className="container stack">
        <section className="card">
          <h1 className="title">Panel de cliente</h1>
          <p className="subtitle">
            Aquí conectaremos el registro de peso, pasos, comentarios y objetivos propios.
          </p>
        </section>

        <section className="grid grid-2">
          <div className="card stack">
            <h2>Registro diario</h2>
            <input className="input" placeholder="Peso" />
            <input className="input" placeholder="Pasos" />
            <input className="input" placeholder="Comentario" />
            <button className="button">Guardar</button>
          </div>

          <div className="card stack">
            <h2>Evolución</h2>
            <p className="muted">La gráfica y comparativas se conectarán en la siguiente fase.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
