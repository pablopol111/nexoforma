"use client";

import { useMemo, useState } from "react";
import { formatDate, formatNumber, formatShortDate, formatSteps } from "@/lib/utils";
import type { DailyEntryRecord, MeasurementEntryRecord } from "@/lib/types";

type Props = {
  dailyEntries: DailyEntryRecord[];
  measurementEntries: MeasurementEntryRecord[];
  mode?: "summary" | "full";
};

function buildDays(mode: "summary" | "full", cursor: Date) {
  const days: Date[] = [];
  const start = new Date(cursor);
  if (mode === "summary") {
    start.setDate(cursor.getDate() - 6);
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = (monthStart.getDay() + 6) % 7;
  monthStart.setDate(monthStart.getDate() - startWeekday);
  while (days.length < 42) {
    const day = new Date(monthStart);
    day.setDate(monthStart.getDate() + days.length);
    days.push(day);
  }
  return days;
}

export function CalendarSummary({ dailyEntries, measurementEntries, mode = "summary" }: Props) {
  const [view, setView] = useState<"summary" | "full">(mode);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const days = useMemo(() => buildDays(view, cursor), [view, cursor]);

  const selected = selectedDate ?? days[days.length - 1]?.toISOString().slice(0, 10);
  const selectedDaily = dailyEntries.find((item) => item.entry_date === selected) ?? null;
  const selectedMeasurement = measurementEntries.find((item) => item.entry_date === selected) ?? null;

  return (
    <section className="panel stack">
      <div className="panelHead split">
        <h2>Calendario</h2>
        <div className="segmented">
          <button type="button" className={view === "summary" ? "" : "inactive"} onClick={() => setView("summary")}>Semana</button>
          <button type="button" className={view === "full" ? "" : "inactive"} onClick={() => setView("full")}>Mes</button>
        </div>
      </div>
      <div className="calendarToolbar">
        <button type="button" className="secondary" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - (view === "summary" ? 7 : 30)))}>Anterior</button>
        <strong>{cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</strong>
        <button type="button" className="secondary" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + (view === "summary" ? 7 : 30)))}>Siguiente</button>
      </div>
      {view === "full" ? <div className="weekdayHeader">{"LMXJVSD".split("").map((label) => <span key={label}>{label}</span>)}</div> : null}
      <div className={`calendarGrid ${view === "full" ? "month" : "week"}`}>
        {days.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const daily = dailyEntries.find((item) => item.entry_date === key);
          const measurement = measurementEntries.find((item) => item.entry_date === key);
          const isSelected = selected === key;
          const inCurrentMonth = date.getMonth() === cursor.getMonth();
          return (
            <button key={key} type="button" className={`calendarDay ${isSelected ? "selected" : ""} ${inCurrentMonth ? "" : "mutedDay"}`} onClick={() => setSelectedDate(key)}>
              <strong>{view === "summary" ? formatShortDate(key) : date.getDate()}</strong>
              <span>{daily ? `${formatNumber(daily.weight_kg, 1)} kg` : "Sin datos"}</span>
              <span>{daily ? `${formatSteps(daily.steps)} pasos` : ""}</span>
              {measurement ? <small>Medidas</small> : null}
            </button>
          );
        })}
      </div>
      <div className="panel detailPanel">
        <div className="panelHead"><h3>Detalle del día</h3></div>
        <div className="detailsGrid oneCol">
          <div className="detailCard"><span>Fecha</span><strong>{formatDate(selected)}</strong></div>
          <div className="detailCard"><span>Peso</span><strong>{selectedDaily ? `${formatNumber(selectedDaily.weight_kg, 2)} kg` : "-"}</strong></div>
          <div className="detailCard"><span>Pasos</span><strong>{selectedDaily ? formatSteps(selectedDaily.steps) : "-"}</strong></div>
          <div className="detailCard"><span>Comentario</span><strong>{selectedDaily?.comment ?? selectedMeasurement?.comment ?? "-"}</strong></div>
        </div>
        {selectedMeasurement ? (
          <div className="simpleList">
            <span>Cintura {formatNumber(selectedMeasurement.waist_cm, 1)} cm</span>
            <span>Cadera {formatNumber(selectedMeasurement.hip_cm, 1)} cm</span>
            <span>Pecho {formatNumber(selectedMeasurement.chest_cm, 1)} cm</span>
            <span>Muslo {formatNumber(selectedMeasurement.thigh_relaxed_cm, 1)} cm</span>
          </div>
        ) : <small>No hay medidas registradas para esta fecha.</small>}
      </div>
    </section>
  );
}
