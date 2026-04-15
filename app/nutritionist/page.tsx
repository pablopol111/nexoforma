export default function NutritionistPage() {
  return (
    <main className="page">
      <div className="container stack">
        <section className="card">
          <h1 className="title">Panel de nutricionista</h1>
          <p className="subtitle">
            Aquí conectaremos clientes, evolución, alertas e informes.
          </p>
        </section>

        <section className="grid grid-2">
          <div className="card stack">
            <h2>Clientes</h2>
            <p className="muted">Listado conectado a base de datos.</p>
          </div>

          <div className="card stack">
            <h2>Indicadores</h2>
            <p className="muted">Último peso, tendencia, inactividad y objetivos.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
