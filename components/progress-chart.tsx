"use client";

import { useMemo, useState } from "react";
import { formatNumber, formatSteps } from "@/lib/utils";

type EntryPoint = { id: string; entry_date: string; weight_kg: number; steps: number };

type MetricKey = "weight_kg" | "steps";

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

export function ProgressChart({ entries }: { entries: EntryPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("weight_kg");
  const points = useMemo(() => [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()), [entries]);
  if (!points.length) return <section className="panel"><div className="emptyBox">Todavía no hay registros.</div></section>;

  const values = points.map((entry) => metric === "weight_kg" ? entry.weight_kg : entry.steps);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, metric === "weight_kg" ? 0.8 : 500);
  const yMin = min - spread * 0.15;
  const yMax = max + spread * 0.15;
  const width = 760;
  const height = 280;
  const left = 40;
  const bottom = 32;
  const top = 20;
  const innerWidth = width - left - 12;
  const innerHeight = height - top - bottom;
  const coords = points.map((entry, index) => {
    const value = metric === "weight_kg" ? entry.weight_kg : entry.steps;
    const x = left + (points.length === 1 ? innerWidth / 2 : (innerWidth / Math.max(points.length - 1, 1)) * index);
    const y = top + ((yMax - value) / Math.max(yMax - yMin, 1)) * innerHeight;
    return { x, y, label: shortDate(entry.entry_date), value };
  });
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="panel stack">
      <div className="chartHead">
        <div className="panelHead compactHead"><h2>Progreso</h2></div>
        <div className="segmented">
          <button type="button" className={metric === "weight_kg" ? "" : "inactive"} onClick={() => setMetric("weight_kg")}>Peso</button>
          <button type="button" className={metric === "steps" ? "" : "inactive"} onClick={() => setMetric("steps")}>Pasos</button>
        </div>
      </div>
      <svg className="chartSvg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Progreso">
        <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="3" />
        {coords.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="4" fill="var(--accent)" />
            <text x={point.x} y={height - 10} textAnchor="middle" className="chartAxisText">{point.label}</text>
          </g>
        ))}
      </svg>
      <div className="metricsRow">
        <div className="miniStat"><span>Inicio</span><strong>{metric === "weight_kg" ? `${formatNumber(points[0]?.weight_kg)} kg` : formatSteps(points[0]?.steps)}</strong></div>
        <div className="miniStat"><span>Actual</span><strong>{metric === "weight_kg" ? `${formatNumber(points[points.length - 1]?.weight_kg)} kg` : formatSteps(points[points.length - 1]?.steps)}</strong></div>
      </div>
    </section>
  );
}
