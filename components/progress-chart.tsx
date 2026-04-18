import type { DailyEntryRecord } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

type ProgressChartProps = {
  entries: DailyEntryRecord[];
};

function getCoordinates(entries: DailyEntryRecord[], width: number, height: number, padding: number) {
  if (entries.length === 0) return [];
  const weights = entries.map((entry) => entry.weight_kg);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight || 1;

  return entries.map((entry, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(entries.length - 1, 1);
    const y = height - padding - ((entry.weight_kg - minWeight) / range) * (height - padding * 2);
    return { x, y, entry };
  });
}

export function ProgressChart({ entries }: ProgressChartProps) {
  const chartEntries = entries.slice(-14);

  if (!chartEntries.length) {
    return (
      <section className="panel stack compactChartPanel">
        <div className="panelHead"><h2>Progreso de peso</h2></div>
        <div className="emptyBox">Todavía no hay registros suficientes para dibujar la evolución.</div>
      </section>
    );
  }

  const width = 640;
  const height = 220;
  const padding = 34;
  const coordinates = getCoordinates(chartEntries, width, height, padding);
  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const latest = chartEntries[chartEntries.length - 1];
  const first = chartEntries[0];
  const delta = latest.weight_kg - first.weight_kg;

  return (
    <section className="panel stack compactChartPanel">
      <div className="chartHead wrapOnMobile">
        <div>
          <h2>Progreso de peso</h2>
          <p>Últimos {chartEntries.length} registros disponibles</p>
        </div>
        <div className="legendRow chartLegend">
          <span className="legendSwatch current">Actual · {formatNumber(latest.weight_kg, 2)} kg</span>
          <span className="chip">Variación {delta > 0 ? "+" : ""}{formatNumber(delta, 2)} kg</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chartSvg" role="img" aria-label="Evolución del peso">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) / 3) * line;
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} className="chartGrid" />;
        })}
        <polyline points={polyline} className="chartLine" />
        {coordinates.map((point, index) => (
          <g key={point.entry.id}>
            <circle cx={point.x} cy={point.y} r={index === coordinates.length - 1 ? 5 : 4} className="chartPoint" />
            <text x={point.x} y={height - 10} textAnchor="middle" className="chartLabel">{formatDate(point.entry.entry_date)}</text>
          </g>
        ))}
      </svg>
    </section>
  );
}
