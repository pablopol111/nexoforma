import { formatNumber, formatShortDate } from "@/lib/utils";
import type { MeasurementEntryRecord } from "@/lib/types";

type MeasurementKey = "waist_cm" | "hip_cm" | "thigh_relaxed_cm" | "biceps_normal_cm" | "biceps_flexed_cm" | "chest_cm";
const AXES: { key: MeasurementKey; label: string }[] = [
  { key: "waist_cm", label: "Cintura" },
  { key: "hip_cm", label: "Cadera" },
  { key: "thigh_relaxed_cm", label: "Muslo" },
  { key: "biceps_normal_cm", label: "Bíceps" },
  { key: "biceps_flexed_cm", label: "Bíceps tensión" },
  { key: "chest_cm", label: "Pecho" },
];

function toPolygon(record: MeasurementEntryRecord, radius: number, center: number, maxValue: number) {
  return AXES.map((axis, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / AXES.length;
    const rawValue = record[axis.key] ?? 0;
    const ratio = Math.max(0.12, Math.min(1, rawValue / maxValue));
    const x = center + Math.cos(angle) * radius * ratio;
    const y = center + Math.sin(angle) * radius * ratio;
    return `${x},${y}`;
  }).join(" ");
}

export function MeasurementsRadar({ entries }: { entries: MeasurementEntryRecord[] }) {
  if (!entries.length) {
    return <section className="panel"><div className="emptyBox">Todavía no hay medidas para mostrar la comparativa.</div></section>;
  }

  const latest = entries[0];
  const compare = entries[Math.min(1, entries.length - 1)] ?? latest;
  const values = entries.flatMap((item) => AXES.map((axis) => item[axis.key] ?? 0));
  const maxValue = Math.max(...values, 100);
  const size = 340;
  const center = 170;
  const radius = 112;

  return (
    <section className="panel stack">
      <div className="panelHead split">
        <h2>Comparativa de medidas</h2>
        <div className="legendRow">
          <span className="legendAccent">Actual · {formatShortDate(latest.entry_date)}</span>
          <span className="legendAccent2">Anterior · {formatShortDate(compare.entry_date)}</span>
        </div>
      </div>
      <div className="radarLayout">
        <svg className="radarSvg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Comparativa radial de medidas">
          {[1, 2, 3, 4].map((ring) => (
            <circle key={ring} cx={center} cy={center} r={(radius / 4) * ring} fill="none" className="chartGrid" />
          ))}
          {AXES.map((axis, index) => {
            const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / AXES.length;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            const lx = center + Math.cos(angle) * (radius + 18);
            const ly = center + Math.sin(angle) * (radius + 18);
            return (
              <g key={axis.key}>
                <line x1={center} y1={center} x2={x} y2={y} className="chartGrid" />
                <text x={lx} y={ly} textAnchor="middle" className="chartAxisText">{axis.label}</text>
              </g>
            );
          })}
          <polygon points={toPolygon(compare, radius, center, maxValue)} fill="rgba(97, 183, 255, 0.15)" stroke="var(--accent-2)" strokeWidth="2.5" />
          <polygon points={toPolygon(latest, radius, center, maxValue)} fill="rgba(240, 199, 94, 0.18)" stroke="var(--accent)" strokeWidth="2.5" />
        </svg>
        <div className="tableWrap compactTable">
          <table>
            <thead><tr><th>Zona</th><th>Actual</th><th>Anterior</th></tr></thead>
            <tbody>
              {AXES.map((axis) => (
                <tr key={axis.key}>
                  <td>{axis.label}</td>
                  <td>{formatNumber(latest[axis.key], 2)} cm</td>
                  <td>{formatNumber(compare[axis.key], 2)} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
