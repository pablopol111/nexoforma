import { formatNumber, formatShortDate, formatSteps } from '@/lib/utils';
import type { DailyEntryRecord, MeasurementEntryRecord } from '@/lib/types';

type Props = {
  dailyEntries: DailyEntryRecord[];
  measurementEntries: MeasurementEntryRecord[];
};

export function CalendarSummary({ dailyEntries, measurementEntries }: Props) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return key;
  });

  return (
    <section className="panel stack" id="calendar">
      <div className="panelHead"><h2>Calendario</h2></div>
      <div className="calendarGrid">
        {days.map((day) => {
          const daily = dailyEntries.find((item) => item.entry_date === day);
          const measurement = measurementEntries.find((item) => item.entry_date === day);
          return (
            <article key={day} className="calendarDay">
              <strong>{formatShortDate(day)}</strong>
              {daily ? (
                <>
                  <span>Registrado</span>
                  <span>{formatNumber(daily.weight_kg, 2)} kg</span>
                  <span>{formatSteps(daily.steps)} pasos</span>
                </>
              ) : <span>Sin datos</span>}
              {measurement ? <span>Medidas registradas</span> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
