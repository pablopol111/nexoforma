"use client";

import { FormEvent, useState } from "react";
import { todayValue } from "@/lib/utils";

type ApiResponse = {
  success: boolean;
  message: string;
};

type Props = {
  defaultDate?: string;
};

export function DailyEntryForm({ defaultDate = todayValue() }: Props) {
  const [entryDate, setEntryDate] = useState(defaultDate);
  const [weightKg, setWeightKg] = useState("");
  const [steps, setSteps] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/client/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate,
          weightKg: Number(weightKg.replace(",", ".")),
          steps: Number(steps),
        }),
      });

      const data = (await response.json()) as ApiResponse;
      setResult(data);

      if (response.ok) {
        setWeightKg("");
        setSteps("");
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "No se pudo guardar la entrada.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panelHead">
        <h2>Registro diario</h2>
      </div>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="entryDate">Fecha</label>
          <input id="entryDate" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="weightKg">Peso</label>
          <input id="weightKg" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="84.2" required />
        </div>
        <div className="field">
          <label htmlFor="steps">Pasos</label>
          <input id="steps" type="number" min={0} value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="9000" required />
        </div>
        <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
      </form>
      {result ? <p className={result.success ? "success" : "error"}>{result.message}</p> : null}
    </section>
  );
}