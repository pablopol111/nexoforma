import { formatDateTime } from "@/lib/utils";

export function RequestPanel({ requests }: { requests: { id: string; requested_at: string; weight_status: string; measurements_status: string }[] }) {
  return (
    <section className="panel stack">
      <div className="panelHead"><h2>Solicitudes pendientes</h2></div>
      {!requests.length ? <div className="emptyBox">No hay solicitudes pendientes.</div> : (
        <div className="listGrid compactList">
          {requests.map((item) => (
            <article key={item.id} className="listCard">
              <strong>{formatDateTime(item.requested_at)}</strong>
              <span>Peso: {item.weight_status}</span>
              <span>Medidas: {item.measurements_status}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
