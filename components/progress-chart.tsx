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

const METRICS: Record<MetricKey, { label: string; unit: string; color: string; gradient: string }> = {
  weight_kg: {
    label: "Peso",
    unit: "kg",
    color: "#5da8ff",
    gradient: "rgba(93, 168, 255, 0.16)",
  },
  body_fat_pct: {
    label: "% grasa",
    unit: "%",
    color: "#f1c84b",
    gradient: "rgba(241, 200, 75, 0.16)",
  },
};

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatMetric(value: number | null, unit: string) {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)} ${unit}`;
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
    const yMax = max + padding;
    const safeMin = Number.isFinite(yMin) ? yMin : 0;
    const safeMax = Number.isFinite(yMax) && yMax > safeMin ? yMax : safeMin + 1;

    const width = 760;
    const height = 340;
    const left = 58;
    const right = 20;
    const top = 28;
    const bottom = 46;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;
    const xStep = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth / 2;

    const mapY = (value: number) => top + ((safeMax - value) / (safeMax - safeMin)) * innerHeight;

    const coordinates = points.map((point, index) => {
      const x = points.length === 1 ? left + innerWidth / 2 : left + xStep * index;
      return {
        ...point,
        x,
        y: mapY(point.value),
      };
    });

    const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
    const area = `${left},${top + innerHeight} ${polyline} ${coordinates[coordinates.length - 1].x},${top + innerHeight}`;
    const axisValues = [safeMax, safeMax - (safeMax - safeMin) / 2, safeMin].map(roundValue);
    const first = points[0]?.value ?? null;
    const last = points[points.length - 1]?.value ?? null;
    const delta = first !== null && last !== null ? roundValue(last - first) : null;

    return {
      coordinates,
      polyline,
      area,
      axisValues,
      first,
      last,
      delta,
      safeMin: roundValue(safeMin),
      safeMax: roundValue(safeMax),
      width,
      height,
      left,
      right,
      top,
      bottom,
      innerHeight,
      innerWidth,
    };
  }, [metric, points, scaleMode]);

  const metricConfig = METRICS[metric];

  if (!chart || !points.length) {
    return (
      <div className="chartWrap">
        <div className="panelHeader">
          <div>
            <h2 className="pageSectionTitle">Evolución del progreso</h2>
            <p className="pageSectionSubtitle">
              Aquí aparecerá la gráfica en cuanto existan entradas de seguimiento.
            </p>
          </div>
        </div>
        <div className="chartEmpty">
          Todavía no hay datos suficientes para dibujar la gráfica. Cuando el nutricionista o el
          cliente registren mediciones, el eje se ajustará automáticamente para mostrar bien la
          evolución real.
        </div>
      </div>
    );
  }

  return (
    <div className="chartWrap">
      <div className="chartToolbar">
        <div>
          <h2 className="pageSectionTitle">Evolución del progreso</h2>
          <p className="pageSectionSubtitle">
            La escala puede ser dinámica o arrancar desde cero para interpretar mejor el cambio.
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
              Desde cero
            </button>
          </div>
        </div>
      </div>

      <div className="chartLegend">
        <div className="legendItem">
          <span className="legendDot" style={{ background: metricConfig.color }} />
          {metricConfig.label}
        </div>
        <div className="legendItem">Rango {formatMetric(chart.safeMin, metricConfig.unit)} - {formatMetric(chart.safeMax, metricConfig.unit)}</div>
      </div>

      <svg
        className="chartSvg"
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        role="img"
        aria-label={`Gráfica de ${metricConfig.label}`}
      >
        <defs>
          <linearGradient id={`nexo-gradient-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={metricConfig.gradient} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>

        {chart.axisValues.map((axisValue) => {
          const y =
            chart.top +
            ((chart.safeMax - axisValue) / (chart.safeMax - chart.safeMin || 1)) * chart.innerHeight;

          return (
            <g key={axisValue}>
              <line
                x1={chart.left}
                y1={y}
                x2={chart.width - chart.right}
                y2={y}
                stroke="rgba(148, 163, 184, 0.18)"
                strokeDasharray="6 8"
              />
              <text x={8} y={y + 4} className="axisLabel">
                {axisValue.toFixed(1)}
              </text>
            </g>
          );
        })}

        <polygon fill={`url(#nexo-gradient-${metric})`} points={chart.area} />
        <polyline
          fill="none"
          stroke={metricConfig.color}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={chart.polyline}
        />

        {chart.coordinates.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="6" fill={metricConfig.color} />
            <circle cx={point.x} cy={point.y} r="12" fill={metricConfig.gradient} />
            <text x={point.x} y={chart.height - 12} textAnchor="middle" className="axisLabel">
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="chartSummary">
        <div className="summaryTile">
          <strong>{formatMetric(chart.first, metricConfig.unit)}</strong>
          <span>Primer valor</span>
        </div>
        <div className="summaryTile">
          <strong>{formatMetric(chart.last, metricConfig.unit)}</strong>
          <span>Último valor</span>
        </div>
        <div className="summaryTile">
          <strong>
            {chart.delta === null ? "-" : `${chart.delta > 0 ? "+" : ""}${chart.delta.toFixed(1)} ${metricConfig.unit}`}
          </strong>
          <span>Variación total</span>
        </div>
      </div>
    </div>
  );
}
