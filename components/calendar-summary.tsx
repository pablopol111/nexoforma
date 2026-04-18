"use client";

import { useMemo, useState } from "react";
import { formatDate, formatNumber, formatShortDate, formatSteps } from "@/lib/utils";
import type { DailyEntryRecord, MeasurementEntryRecord } from "@/lib/types";

type Props = {
  dailyEntries: DailyEntryRecord[];
  measurementEntries: MeasurementEntryRecord[];
};

type CalendarDayItem = {
  key: string;
  daily: DailyEntryRecord | undefined;
  measurement: MeasurementEntryRecord | undefined;
};

function buildLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

export function CalendarSummary({ dailyEntries, measurementEntries }: Props) {
  const items = useMemo<CalendarDayItem[]>(() => {
    return buildLastSevenDays().map((day) => ({
      key: day,
      daily: dailyEntries.find((item) => item.entry_date === day),
      measurement: measurementEntries.find((item) => item.entry_date === day),
    }));
  }, [dailyEntries, measurementEntries]);

  const defaultSelected = [...items].reverse().find((item) => item.daily || item.measurement)?.key ?? items[items.length - 1]?.key ?? "";
  const [selectedDay, setSelectedDay] = useState(defaultSelected);
  const activeDay = items.find((item) => item.key === selectedDay) ?? items[items.length - 1] ?? null;

  if (!items.length) {
    return <section className="panel"><div className="emptyBox">Todavía no hay calendario disponible.</div></section>;
  }

  return (
    <section className="panel stack" id="calendar">
      <div className="panelHead split">
        <h2>Calendario semanal</h2>
        <span className="chip">Pulsa un día para ver el detalle</span>
      </div>
      <div className="calendarGrid calendarInteractive">
        {items.map((item) => {
          const isActive = item.key === activeDay?.key;
          const hasDaily = Boolean(item.daily);
          const hasMeasurement = Boolean(item.measurement);
          return (
            <button
              key={item.key}
              type="button"
              className={`calendarDayButton${isActive ? " active" : ""}${hasDaily || hasMeasurement ? " hasData" : ""}`}
              onClick={() => setSelectedDay(item.key)}
            >
              <span className="calendarDayTitle">{formatShortDate(item.key)}</span>
              <span className="calendarDayState">{hasDaily ? "Registrado" : "Sin datos"}</span>
              {hasDaily ? <span>{formatNumber(item.daily?.weight_kg, 1)} kg</span> : <span>-</span>}
              {hasDaily ? <span>{formatSteps(item.daily?.steps)} pasos</span> : <span>-</span>}
              {hasMeasurement ? <span className="calendarBadge">Medidas registradas</span> : <span className="calendarBadge ghost">Sin medidas</span>}
            </button>
          );
        })}
      </div>

      {activeDay ? (
        <section className="calendarDetail">
          <div className="panelHead compactHead">
            <h3>{formatDate(activeDay.key)}</h3>
            <span className="chip">Detalle del día</span>
          </div>
          <div className="columns two alignStart">
            <article className="detailCard">
              <span>Registro diario</span>
              {activeDay.daily ? (
                <div className="stack compactStack">
                  <strong>{formatNumber(activeDay.daily.weight_kg, 2)} kg</strong>
                  <span>{formatSteps(activeDay.daily.steps)} pasos</span>
                  <span>{activeDay.daily.comment?.trim() ? activeDay.daily.comment : "Sin comentario"}</span>
                </div>
              ) : (
                <p>Ese día no hay peso ni pasos registrados.</p>
              )}
            </article>
            <article className="detailCard">
              <span>Medidas</span>
              {activeDay.measurement ? (
                <div className="stack compactStack">
                  <div className="measureList">
                    <span>Cintura: {formatNumber(activeDay.measurement.waist_cm, 1)} cm</span>
                    <span>Cadera: {formatNumber(activeDay.measurement.hip_cm, 1)} cm</span>
                    <span>Muslo: {formatNumber(activeDay.measurement.thigh_relaxed_cm, 1)} cm</span>
                    <span>Bíceps normal: {formatNumber(activeDay.measurement.biceps_normal_cm, 1)} cm</span>
                    <span>Bíceps tensión: {formatNumber(activeDay.measurement.biceps_flexed_cm, 1)} cm</span>
                    <span>Pecho: {formatNumber(activeDay.measurement.chest_cm, 1)} cm</span>
                  </div>
                  <span>{activeDay.measurement.comment?.trim() ? activeDay.measurement.comment : "Sin comentario"}</span>
                </div>
              ) : (
                <p>Ese día no hay medidas registradas.</p>
              )}
            </article>
          </div>
        </section>
      ) : null}
    </section>
  );
}
