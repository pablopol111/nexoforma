"use client";

import { useMemo, useState } from "react";
import type { DailyEntryRecord, MeasurementEntryRecord, ClientProfileRecord } from "@/lib/types";
import { formatDate, formatNumber, formatSteps } from "@/lib/utils";

export function ReportPreview({ dailyEntries, measurementEntries, clientProfile }: { dailyEntries: DailyEntryRecord[]; measurementEntries: MeasurementEntryRecord[]; clientProfile: ClientProfileRecord | null; }) {
  const [from, setFrom] = useState(dailyEntries[0]?.entry_date ?? "");
  const [to, setTo] = useState(dailyEntries[dailyEntries.length - 1]?.entry_date ?? "");

  const filtered = useMemo(() => dailyEntries.filter((item) => (!from || item.entry_date >= from) && (!to || item.entry_date <= to)), [dailyEntries, from, to]);
  const filteredMeasurements = useMemo(() => measurementEntries.filter((item) => (!from || item.entry_date >= from) && (!to || item.entry_date <= to)), [measurementEntries, from, to]);
  const first = filtered[0] ?? null;
  const last = filtered[filtered.length - 1] ?? null;
  const avgSteps = filtered.length ? filtered.reduce((sum, item) => sum + item.steps, 0) / filtered.length : null;

  return (
    <section className="stack">
      <div className="panel splitWrap">
        <div className="inlineFilters">
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <button type="button" onClick={() => window.print()}>Descargar informe en PDF</button>
      </div>
      <section className="panel stack reportPreview" id="report-preview">
        <div className="panelHead split"><h2>Previsualización del informe</h2><span className="chip">{formatDate(from)} · {formatDate(to)}</span></div>
        <div className="statsGrid">
          <article className="statCard"><span>Peso inicial</span><strong>{first ? `${formatNumber(first.weight_kg, 2)} kg` : '-'}</strong></article>
          <article className="statCard"><span>Peso final</span><strong>{last ? `${formatNumber(last.weight_kg, 2)} kg` : '-'}</strong></article>
          <article className="statCard"><span>Variación</span><strong>{first && last ? `${formatNumber(last.weight_kg - first.weight_kg, 2)} kg` : '-'}</strong></article>
          <article className="statCard"><span>Media de pasos</span><strong>{avgSteps != null ? formatSteps(avgSteps) : '-'}</strong></article>
        </div>
        <section className="panel stack nestedPanel">
          <h3>Datos del perfil</h3>
          <div className="simpleList">
            <span>Altura {formatNumber(clientProfile?.height_cm, 1)} cm</span>
            <span>Referencia {formatNumber(clientProfile?.reference_weight_kg, 1)} kg</span>
            <span>Objetivo {formatNumber(clientProfile?.target_weight_kg, 1)} kg</span>
          </div>
        </section>
        <section className="panel stack nestedPanel">
          <h3>Registros incluidos</h3>
          <div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Peso</th><th>Pasos</th><th>Comentario</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{formatDate(item.entry_date)}</td><td>{formatNumber(item.weight_kg,2)} kg</td><td>{formatSteps(item.steps)}</td><td>{item.comment ?? '-'}</td></tr>)}</tbody></table></div>
        </section>
        <section className="panel stack nestedPanel">
          <h3>Medidas incluidas</h3>
          <div className="tableWrap"><table><thead><tr><th>Fecha</th><th>Cintura</th><th>Cadera</th><th>Pecho</th><th>Muslo</th></tr></thead><tbody>{filteredMeasurements.map((item) => <tr key={item.id}><td>{formatDate(item.entry_date)}</td><td>{formatNumber(item.waist_cm,2)}</td><td>{formatNumber(item.hip_cm,2)}</td><td>{formatNumber(item.chest_cm,2)}</td><td>{formatNumber(item.thigh_relaxed_cm,2)}</td></tr>)}</tbody></table></div>
        </section>
      </section>
    </section>
  );
}
