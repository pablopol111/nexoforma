"use client";

import { useMemo, useState } from "react";
import type { MeasurementEntryRecord } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

type Props = {
  entries: MeasurementEntryRecord[];
  targetWeight: number | null;
};

type MetricKey = "waist_cm" | "hip_cm" | "thigh_relaxed_cm" | "biceps_normal_cm" | "biceps_flexed_cm" | "chest_cm";

type MetricConfig = {
  key: MetricKey;
  label: string;
};

const metrics: MetricConfig[] = [
  { key: "waist_cm", label: "Cintura" },
  { key: "hip_cm", label: "Cadera" },
  { key: "thigh_relaxed_cm", label: "Muslo" },
  { key: "biceps_normal_cm", label: "Bíceps" },
  { key: "biceps_flexed_cm", label: "Bíceps tensión" },
  { key: "chest_cm", label: "Pecho" },
];

function getValue(entry: MeasurementEntryRecord, key: MetricKey) {
  return entry[key] ?? 0;
}

function polygonPoints(entry: MeasurementEntryRecord, maxValue: number, center: number, radius: number) {
  return metrics
    .map((metric, index) => {
      const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / metrics.length;
      const ratio = Math.min(1, Math.max(0, getValue(entry, metric.key) / Math.max(maxValue, 1)));
      const x = center + Math.cos(angle) * radius * ratio;
      const y = center + Math.sin(angle) * radius * ratio;
      return `${x},${y}`;
    })
    .join(" ");
}

export function MeasurementRadar({ entries, targetWeight }: Props) {
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()),
    [entries],
  );

  const latest = sortedEntries[0] ?? null;
  const compareOptions = sortedEntries.slice(1);
  const [selectedComparisonDate, setSelectedComparisonDate] = useState(compareOptions[0]?.entry_date ?? latest?.entry_date ?? "");
  const comparison = compareOptions.find((item) => item.entry_date === selectedComparisonDate) ?? compareOptions[0] ?? latest;

  if (!latest) {
    return (
      <section className="panel stack">
        <div className="panelHead"><h2>Comparativa de medidas</h2></div>
        <div className="emptyBox">Todavía no hay medidas suficientes para construir la comparativa.</div>
      </section>
    );
  }

  const activeComparison = comparison ?? latest;

  const maxValue = Math.max(
    1,
    ...metrics.flatMap((metric) => [getValue(latest, metric.key), getValue(activeComparison, metric.key)]),
  ) * 1.1;

  const size = 260;
  const center = size / 2;
  const radius = 88;
  const latestPolygon = polygonPoints(latest, maxValue, center, radius);
  const comparisonPolygon = polygonPoints(activeComparison, maxValue, center, radius);
  const weightDiffToTarget = latest.weight_kg != null && targetWeight != null ? latest.weight_kg - targetWeight : null;

  return (
    <section className="panel stack measureRadarPanel">
      <div className="panelHead split">
        <h2>Comparativa de medidas</h2>
        {compareOptions.length ? (
          <div className="fieldInline">
            <label htmlFor="measurement-compare">Comparar con</label>
            <select id="measurement-compare" value={selectedComparisonDate} onChange={(event) => setSelectedComparisonDate(event.target.value)}>
              {compareOptions.map((item) => (
                <option key={item.id} value={item.entry_date}>{formatDate(item.entry_date)}</option>
              ))}
            </select>
          </div>
        ) : <span className="chip">Solo hay una toma registrada</span>}
      </div>

      <div className="radarLayout">
        <div className="radarCanvasWrap">
          <svg className="radarSvg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Comparativa radar de medidas">
            {[0.25, 0.5, 0.75, 1].map((level) => {
              const points = metrics
                .map((_, index) => {
                  const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / metrics.length;
                  const x = center + Math.cos(angle) * radius * level;
                  const y = center + Math.sin(angle) * radius * level;
                  return `${x},${y}`;
                })
                .join(" ");
              return <polygon key={level} points={points} className="radarGrid" />;
            })}

            {metrics.map((metric, index) => {
              const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / metrics.length;
              const lineX = center + Math.cos(angle) * radius;
              const lineY = center + Math.sin(angle) * radius;
              const labelX = center + Math.cos(angle) * (radius + 24);
              const labelY = center + Math.sin(angle) * (radius + 24);
              return (
                <g key={metric.key}>
                  <line x1={center} y1={center} x2={lineX} y2={lineY} className="radarAxis" />
                  <text x={labelX} y={labelY} textAnchor="middle" className="radarAxisLabel">{metric.label}</text>
                </g>
              );
            })}

            <polygon points={comparisonPolygon} className="radarPolygon comparison" />
            <polygon points={latestPolygon} className="radarPolygon latest" />
          </svg>
        </div>

        <div className="stack compactStack">
          <div className="legendRow radarLegend">
            <span className="legendSwatch latest">Actual · {formatDate(latest.entry_date)}</span>
            <span className="legendSwatch comparison">Comparada · {formatDate(activeComparison.entry_date)}</span>
          </div>
          <div className="columns two">
            {metrics.map((metric) => {
              const latestValue = getValue(latest, metric.key);
              const compareValue = getValue(activeComparison, metric.key);
              const delta = latestValue - compareValue;
              return (
                <article key={metric.key} className="detailCard compactCard">
                  <span>{metric.label}</span>
                  <strong>{latestValue ? `${formatNumber(latestValue, 1)} cm` : "-"}</strong>
                  <small>{activeComparison.id === latest.id ? "Sin comparativa previa" : `${delta >= 0 ? "+" : ""}${formatNumber(delta, 1)} cm vs ${formatDate(activeComparison.entry_date)}`}</small>
                </article>
              );
            })}
          </div>
          <div className="detailCard compactCard">
            <span>Peso asociado a la toma</span>
            <strong>{latest.weight_kg != null ? `${formatNumber(latest.weight_kg, 2)} kg` : "-"}</strong>
            <small>{weightDiffToTarget == null ? "Sin referencia de objetivo para comparar." : weightDiffToTarget <= 0 ? "Ya estás en objetivo o por debajo en esta toma." : `${formatNumber(weightDiffToTarget, 2)} kg por encima del objetivo.`}</small>
          </div>
        </div>
      </div>
    </section>
  );
}
