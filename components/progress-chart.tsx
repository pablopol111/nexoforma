"use client";

import { useMemo, useState } from "react";
import { formatDate, formatNumber, formatSteps } from "@/lib/utils";

type EntryPoint = {
  id: string;
  entry_date: string;
  weight_kg: number;
  steps: number;
};

type MetricKey = "weight_kg" | "steps";
type ScaleMode = "dynamic" | "zero";

type ChartPoint = {
  id: string;
  label: string;
  value: number;
};

const METRICS: Record<MetricKey, { label: string; unit: string; color: string; formatter: (value: number | null) => string }> = {
  weight_kg: {
    label: "Peso",
    unit: "kg",
    color: "var(--accent)",
    formatter: (value) => `${formatNumber(value)} kg`,
  },
  steps: {
    label: "Pasos",
    unit: "",
    color: "var(--accent-2)",
    formatter: (value) => formatSteps(value),
  },
};

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

export function ProgressChart({ entries }: { entries: EntryPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("weight_kg");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("dynamic");

  const points = useMemo<ChartPoint[]>(() => {
    return [...entries]
      .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
      .map((entry) => ({
        id: entry.id,
        label: shortDate(entry.entry_date),
        value: metric === "weight_kg" ? entry.weight_kg : entry.steps,
      }));
  }, [entries, metric]);

  const chart = useMemo(() => {
    if (!points.length) {
      return null;
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Math.max(max - min, metric === "weight_kg" ? 0.8 : 250);
    const padding = Math.max(spread * 0.2, metric === "weight_kg" ? 0.6 : 300);
    const yMin = scaleMode === "dynamic" ? min - padding : 0;
    const yMax = max + padding;
    const safeMin = Number.isFinite(yMin) ? yMin : 0;
    const safeMax = Number.isFinite(yMax) && yMax > safeMin ? yMax : safeMin + 1;
    const width = 760;
    const height = 320;
    const left = 56;
    const right = 20;
    const top = 20;
    const bottom = 44;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;
    const xStep = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth / 2;
    const mapY = (value: number) => top + ((safeMax - value) / (safeMax - safeMin)) * innerHeight;
    const coordinates = points.map((point, index) => ({
      ...point,
      x: points.length === 1 ? left + innerWidth / 2 : left + xStep * index,
      y: mapY(point.value),
    }));
    const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
    const area = `${left},${top + innerHeight} ${polyline} ${coordinates[coordinates.length - 1].x},${top + innerHeight}`;
    const first = points[0]?.value ?? null;
    const last = points[points.length - 1]?.value ?? null;
    const delta = first !== null && last !== null ? last - first : null;
    const axisValues = [safeMax, safeMax - (safeMax - safeMin) / 2, safeMin];

    return {
      width,
      height,
      left,
      top,
      bottom,
      innerHeight,
      polyline,
      area,
      coordinates,
      first,
      last,
      delta,
      axisValues,
      min: safeMin,
      max: safeMax,
    };
  }, [metric, points, scaleMode]);

  if (!chart) {
    return (
      <section className="panel stack">
        <div className="panelHead">
          <h2>Evolución</h2>
        </div>
        <div className="emptyBox">Todavía no hay registros.</div>
      </section>
    );
  }

  const config = METRICS[metric];

  return (
    <section className="panel stack">
      <div className="chartHead">
        <div className="panelHead compactHead">
          <h2>Evolución</h2>
          <p>{formatDate(entries[entries.length - 1]?.entry_date ?? null)}</p>
        </div>
        <div className="segmentedGroup">
          <div className="segmented">
            <button type="button" className={metric === "weight_kg" ? "" : "inactive"} onClick={() => setMetric("weight_kg")}>Peso</button>
            <button type="button" className={metric === "steps" ? "" : "inactive"} onClick={() => setMetric("steps")}>Pasos</button>
          </div>
          <div className="segmented">
            <button type="button" className={scaleMode === "dynamic" ? "" : "inactive"} onClick={() => setScaleMode("dynamic")}>Dinámica</button>
            <button type="button" className={scaleMode === "zero" ? "" : "inactive"} onClick={() => setScaleMode("zero")}>Desde cero</button>
          </div>
        </div>
      </div>
      <div className="metricsRow">
        <div className="miniStat">
          <span>Inicio</span>
          <strong>{config.formatter(chart.first)}</strong>
        </div>
        <div className="miniStat">
          <span>Actual</span>
          <strong>{config.formatter(chart.last)}</strong>
        </div>
        <div className="miniStat">
          <span>Cambio</span>
          <strong>{chart.delta === null ? "-" : config.formatter(chart.delta)}</strong>
        </div>
      </div>
      <svg className="chartSvg" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={config.label}>
        <defs>
          <linearGradient id={`gradient-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={config.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={config.color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((index) => {
          const y = chart.top + (chart.innerHeight / 2) * index;
          return <line key={index} x1={chart.left} x2={chart.width - 20} y1={y} y2={y} className="chartGrid" />;
        })}
        {chart.axisValues.map((value) => {
          const y = chart.top + ((chart.max - value) / (chart.max - chart.min)) * chart.innerHeight;
          return (
            <text key={value} x={12} y={y + 4} className="chartAxisText">
              {metric === "weight_kg" ? formatNumber(value) : formatSteps(Math.round(value))}
            </text>
          );
        })}
        <polygon points={chart.area} fill={`url(#gradient-${metric})`} />
        <polyline points={chart.polyline} fill="none" stroke={config.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {chart.coordinates.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="4.5" fill={config.color} />
            <text x={point.x} y={chart.height - 14} textAnchor="middle" className="chartAxisText">{point.label}</text>
          </g>
        ))}
      </svg>
    </section>
  );
}