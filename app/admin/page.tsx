export default function AdminPage() {
  return (
    <main className="page">
      <div className="container stack">
        <section className="card">
          <h1 className="title">Panel de administrador</h1>
          <p className="subtitle">
            Aquí conectaremos altas de nutricionistas, asignación de tokens y control global.
          </p>
        </section>

        <section className="grid grid-2">
          <div className="card stack">
            <h2>Alta de nutricionista</h2>
            <input className="input" placeholder="Nombre del nutricionista" />
            <input className="input" placeholder="Clínica o marca" />
            <input className="input" placeholder="Token o licencia" />
            <button className="button">Crear nutricionista</button>
          </div>

          <div className="card stack">
            <h2>Resumen del sistema</h2>
            <p className="muted">Nutricionistas activos</p>
            <p className="muted">Licencias disponibles</p>
            <p className="muted">Clientes activos</p>
          </div>
        </section>
      </div>
    </main>
  );
}
