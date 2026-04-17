"use client";

import { FormEvent, useState } from "react";
import { todayValue } from "@/lib/utils";

type ApiResponse = { success: boolean; message: string };

export function DailyEntryForm({ defaultDate = todayValue() }: { defaultDate?: string }) {
  const [entryDate, setEntryDate] = useState(defaultDate);
  const [weightKg, setWeightKg] = useState("");
  const [steps, setSteps] = useState("");
  const [comment, setComment] = useState("");
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
          steps: Number(steps.replace(",", ".")),
          comment: comment.trim(),
        }),
      });
      const data = (await response.json()) as ApiResponse;
      setResult(data);
      if (response.ok) {
        setWeightKg("");
        setSteps("");
        setComment("");
        location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panelHead"><h2>Registro diario</h2></div>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field"><label>Fecha</label><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required /></div>
        <div className="columns two">
          <div className="field"><label>Peso</label><input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="84,20" required /></div>
          <div className="field"><label>Pasos</label><input value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8540,50" required /></div>
        </div>
        <div className="field"><label>Comentario</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} /></div>
        <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar registro"}</button>
      </form>
      {result ? <p className={result.success ? "success" : "error"}>{result.message}</p> : null}
    </section>
  );
}
