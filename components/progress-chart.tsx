"use client";

import { useMemo, useState } from "react";
import { formatDate, formatNumber, formatSteps } from "@/lib/utils";

type EntryPoint = { id: string; entry_date: string; weight_kg: number; steps: number };
type MetricMode = "weight" | "steps" | "both";
type PeriodMode = "week" | "month" | "quarter" | "all" | "custom";

function filterEntries(entries: EntryPoint[], period: PeriodMode, customFrom: string, customTo: string) {
  const sorted = [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  if (period === "all") return sorted;
  const end = customTo ? new Date(customTo) : new Date(sorted[sorted.length - 1]?.entry_date ?? Date.now());
  const start = new Date(end);
  if (period === "week") start.setDate(end.getDate() - 6);
  else if (period === "month") start.setDate(end.getDate() - 29);
  else if (period === "quarter") start.setDate(end.getDate() - 89);
  else if (period === "custom") {
    const from = customFrom ? new Date(customFrom) : new Date(sorted[0]?.entry_date ?? Date.now());
    const to = customTo ? new Date(customTo) : new Date(sorted[sorted.length - 1]?.entry_date ?? Date.now());
    return sorted.filter((entry) => new Date(entry.entry_date) >= from && new Date(entry.entry_date) <= to);
  }
  return sorted.filter((entry) => new Date(entry.entry_date) >= start && new Date(entry.entry_date) <= end);
}

function scaleValues(values: number[], minPadding: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, minPadding);
  return { min: min - spread * 0.15, max: max + spread * 0.15 };
}

export function ProgressChart({ entries }: { entries: EntryPoint[] }) {
  const [metric, setMetric] = useState<MetricMode>("both");
  const [period, setPeriod] = useState<PeriodMode>("month");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const points = useMemo(() => filterEntries(entries, period, customFrom, customTo), [entries, period, customFrom, customTo]);

  if (!points.length) return <section className="panel"><div className="emptyBox">Todavía no hay registros para pintar la gráfica.</div></section>;

  const width = 900;
  const height = 320;
  const left = 56;
  const right = 56;
  const top = 20;
  const bottom = 32;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  const weightScale = scaleValues(points.map((entry) => entry.weight_kg), 1);
  const stepsScale = scaleValues(points.map((entry) => entry.steps), 1000);
  const ticks = 4;

  const coords = points.map((entry, index) => {
    const x = left + (points.length === 1 ? innerWidth / 2 : (innerWidth / Math.max(points.length - 1, 1)) * index);
    const weightY = top + ((weightScale.max - entry.weight_kg) / Math.max(weightScale.max - weightScale.min, 1)) * innerHeight;
    const stepsY = top + ((stepsScale.max - entry.steps) / Math.max(stepsScale.max - stepsScale.min, 1)) * innerHeight;
    return { x, weightY, stepsY, entry };
  });

  const weightPolyline = coords.map((point) => `${point.x},${point.weightY}`).join(" ");
  const stepsPolyline = coords.map((point) => `${point.x},${point.stepsY}`).join(" ");
  const activeIndex = hoveredIndex ?? coords.length - 1;
  const active = coords[activeIndex];
  const tooltipX = Math.max(140, Math.min(width - 160, active.x));
  const tooltipYBase = metric === "steps" ? active.stepsY : active.weightY;
  const tooltipY = Math.max(52, tooltipYBase - 58);

  return (
    <section className="panel stack">
      <div className="chartHead chartHeadWrap">
        <div className="panelHead compactHead"><h2>Progreso</h2></div>
        <div className="filtersWrap">
          <div className="segmented">
            <button type="button" className={metric === "weight" ? "" : "inactive"} onClick={() => setMetric("weight")}>Peso</button>
            <button type="button" className={metric === "steps" ? "" : "inactive"} onClick={() => setMetric("steps")}>Pasos</button>
            <button type="button" className={metric === "both" ? "" : "inactive"} onClick={() => setMetric("both")}>Ambos</button>
          </div>
          <div className="segmented">
            <button type="button" className={period === "week" ? "" : "inactive"} onClick={() => setPeriod("week")}>Semana</button>
            <button type="button" className={period === "month" ? "" : "inactive"} onClick={() => setPeriod("month")}>Mes</button>
            <button type="button" className={period === "quarter" ? "" : "inactive"} onClick={() => setPeriod("quarter")}>Trimestre</button>
            <button type="button" className={period === "all" ? "" : "inactive"} onClick={() => setPeriod("all")}>Todo</button>
            <button type="button" className={period === "custom" ? "" : "inactive"} onClick={() => setPeriod("custom")}>Personalizado</button>
          </div>
          {period === "custom" ? (
            <div className="inlineFilters">
              <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
              <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </div>
          ) : null}
        </div>
      </div>

      <svg className="chartSvg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Progreso de peso y pasos">
        {Array.from({ length: ticks + 1 }, (_, index) => {
          const y = top + (innerHeight / ticks) * index;
          const weightTick = weightScale.max - ((weightScale.max - weightScale.min) / ticks) * index;
          const stepsTick = stepsScale.max - ((stepsScale.max - stepsScale.min) / ticks) * index;
          return (
            <g key={index}>
              <line x1={left} y1={y} x2={width - right} y2={y} className="chartGrid" />
              {(metric === "weight" || metric === "both") ? <text x={8} y={y + 4} className="chartAxisText">{formatNumber(weightTick, 1)}</text> : null}
              {(metric === "steps" || metric === "both") ? <text x={width - 8} y={y + 4} textAnchor="end" className="chartAxisText">{formatSteps(stepsTick)}</text> : null}
            </g>
          );
        })}

        {metric !== "steps" ? <polyline points={weightPolyline} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {metric !== "weight" ? <polyline points={stepsPolyline} fill="none" stroke="var(--accent-2)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {coords.map((point, index) => (
          <g key={point.entry.id} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)}>
            <line x1={point.x} y1={top} x2={point.x} y2={height - bottom} className="chartHoverLine" opacity={activeIndex === index ? 1 : 0} />
            {metric !== "steps" ? <circle cx={point.x} cy={point.weightY} r="5" fill="var(--accent)" /> : null}
            {metric !== "weight" ? <circle cx={point.x} cy={point.stepsY} r="5" fill="var(--accent-2)" /> : null}
          </g>
        ))}

        <g transform={`translate(${tooltipX - 110}, ${tooltipY - 40})`}>
          <rect width="220" height="74" rx="16" fill="var(--bg-elevated)" stroke="var(--line)" />
          <text x="16" y="24" className="chartTooltipTitle">{formatDate(active.entry.entry_date)}</text>
          <text x="16" y="46" className="chartTooltipValue">Peso: {formatNumber(active.entry.weight_kg, 2)} kg</text>
          <text x="16" y="64" className="chartTooltipValue">Pasos: {formatSteps(active.entry.steps)}</text>
        </g>
      </svg>

      <div className="metricsRow">
        <div className="miniStat"><span>Inicio</span><strong>{formatNumber(points[0]?.weight_kg, 2)} kg</strong><small>{formatSteps(points[0]?.steps)} pasos</small></div>
        <div className="miniStat"><span>Actual</span><strong>{formatNumber(points[points.length - 1]?.weight_kg, 2)} kg</strong><small>{formatSteps(points[points.length - 1]?.steps)} pasos</small></div>
        <div className="miniStat"><span>Periodo</span><strong>{points.length} registros</strong><small>{formatDate(points[0]?.entry_date)} · {formatDate(points[points.length - 1]?.entry_date)}</small></div>
      </div>
    </section>
  );
}
