"use client";

import { useMemo, useState } from "react";

type EntryPoint = {
  id: string;
  weight_kg: number;
  body_fat_pct: number | null;
  recorded_at: string;
};

type MetricKey = "weight_kg" | "body_fat_pct";
type ScaleMode = "dynamic" | "zero";

type ChartPoint = {
  id: string;
  label: string;
  value: number;
};

const METRICS: Record<MetricKey, { label: string; unit: string; color: string }> = {
  weight_kg: { label: "Peso", unit: "kg", color: "#0f4c5c" },
  body_fat_pct: { label: "% grasa", unit: "%", color: "#1f9d8b" },
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
  });
}

function roundValue(value: number) {
  return Math.round(value * 10) / 10;
}

export function ProgressChart({ entries }: { entries: EntryPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("weight_kg");
  const [scaleMode, setScaleMode] = useState<ScaleMode>("dynamic");

  const points = useMemo<ChartPoint[]>(() => {
    return [...entries]
      .reverse()
      .map((entry) => {
        const raw = entry[metric];
        if (raw === null || typeof raw !== "number") {
          return null;
        }

        return {
          id: entry.id,
          label: formatShortDate(entry.recorded_at),
          value: Number(raw),
        };
      })
      .filter((entry): entry is ChartPoint => Boolean(entry));
  }, [entries, metric]);

  const chart = useMemo(() => {
    if (!points.length) {
      return null;
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = Math.max(max - min, 0.5);
    const padding = Math.max(spread * 0.2, metric === "weight_kg" ? 0.8 : 0.5);

    const yMin = scaleMode === "dynamic" ? min - padding : 0;
    const yMax = scaleMode === "dynamic" ? max + padding : max + padding;
    const safeMin = Number.isFinite(yMin) ? yMin : 0;
    const safeMax = Number.isFinite(yMax) && yMax > safeMin ? yMax : safeMin + 1;

    const width = 720;
    const height = 320;
    const left = 56;
    const right = 20;
    const top = 24;
    const bottom = 44;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;

    const xStep = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth / 2;
    const mapY = (value: number) => top + ((safeMax - value) / (safeMax - safeMin)) * innerHeight;

    const coordinates = points.map((point, index) => {
      const x = points.length === 1 ? left + innerWidth / 2 : left + xStep * index;
      const y = mapY(point.value);
      return { ...point, x, y };
    });

    const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
    const area = `${left},${top + innerHeight} ${polyline} ${coordinates[coordinates.length - 1].x},${top + innerHeight}`;
    const axisValues = [safeMax, safeMax - (safeMax - safeMin) / 2, safeMin].map(roundValue);
    const first = points[0]?.value ?? null;
    const last = points[points.length - 1]?.value ?? null;
    const delta = first !== null && last !== null ? roundValue(last - first) : null;

    return {
      safeMin: roundValue(safeMin),
      safeMax: roundValue(safeMax),
      coordinates,
      polyline,
      area,
      axisValues,
      first,
      last,
      delta,
      width,
      height,
      left,
      innerHeight,
      top,
    };
  }, [metric, points, scaleMode]);

  if (!points.length || !chart) {
    return (
      <div className="chartEmpty">
        No hay datos suficientes para dibujar una gráfica. En cuanto existan registros de
        seguimiento, aquí verás la evolución y la escala se ajustará automáticamente.
      </div>
    );
  }

  const metricConfig = METRICS[metric];

  return (
    <div className="chartWrap">
      <div className="panelHeader">
        <div>
          <h3 className="pageSectionTitle">Evolución del progreso</h3>
          <p className="pageSectionSubtitle">
            La gráfica puede reescalar el eje vertical según el rango real de valores para
            mostrar mejor el avance.
          </p>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <div className="segmented">
            {(Object.keys(METRICS) as MetricKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={metric === key ? "" : "inactive"}
                onClick={() => setMetric(key)}
              >
                {METRICS[key].label}
              </button>
            ))}
          </div>
          <div className="segmented">
            <button
              type="button"
              className={scaleMode === "dynamic" ? "" : "inactive"}
              onClick={() => setScaleMode("dynamic")}
            >
              Escala dinámica
            </button>
            <button
              type="button"
              className={scaleMode === "zero" ? "" : "inactive"}
              onClick={() => setScaleMode("zero")}
            >
              Escala desde cero
            </button>
          </div>
        </div>
      </div>

      <div className="chartShell">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="chartSvg" role="img" aria-label={`Gráfica de ${metricConfig.label}`}>
          {[0, 0.5, 1].map((factor, index) => {
            const y = chart.top + chart.innerHeight * factor;
            return (
              <g key={index}>
                <line x1={chart.left} y1={y} x2={chart.width - 20} y2={y} stroke="rgba(15, 23, 42, 0.08)" strokeWidth="1" />
                <text x="8" y={y + 4} className="yAxisLabel">
                  {chart.axisValues[index]} {metricConfig.unit}
                </text>
              </g>
            );
          })}

          <polygon points={chart.area} fill={metric === "weight_kg" ? "rgba(15, 76, 92, 0.10)" : "rgba(31, 157, 139, 0.12)"} />
          <polyline
            points={chart.polyline}
            fill="none"
            stroke={metricConfig.color}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {chart.coordinates.map((point) => (
            <g key={point.id}>
              <circle cx={point.x} cy={point.y} r="5.5" fill={metricConfig.color} />
              <text x={point.x} y={chart.height - 14} textAnchor="middle" className="xAxisLabel">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="chartMeta">
        <div className="chartMetaBox">
          <strong>Escala actual</strong>
          <div className="muted">
            {chart.safeMin} {metricConfig.unit} a {chart.safeMax} {metricConfig.unit}
          </div>
        </div>
        <div className="chartMetaBox">
          <strong>Primer registro</strong>
          <div className="muted">
            {roundValue(chart.first ?? 0)} {metricConfig.unit}
          </div>
        </div>
        <div className="chartMetaBox">
          <strong>Último registro</strong>
          <div className="muted">
            {roundValue(chart.last ?? 0)} {metricConfig.unit}
          </div>
        </div>
        <div className="chartMetaBox">
          <strong>Variación</strong>
          <div className="muted">
            {chart.delta !== null ? `${chart.delta > 0 ? "+" : ""}${chart.delta} ${metricConfig.unit}` : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
