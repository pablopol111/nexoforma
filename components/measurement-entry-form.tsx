"use client";

import { FormEvent, useState } from "react";
import { todayValue } from "@/lib/utils";

type ApiResponse = { success: boolean; message: string };

export function MeasurementEntryForm({ defaultDate = todayValue() }: { defaultDate?: string }) {
  const [entryDate, setEntryDate] = useState(defaultDate);
  const [weightKg, setWeightKg] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [thigh, setThigh] = useState("");
  const [bicepsNormal, setBicepsNormal] = useState("");
  const [bicepsFlexed, setBicepsFlexed] = useState("");
  const [chest, setChest] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        entryDate,
        weightKg: weightKg ? Number(weightKg.replace(",", ".")) : null,
        waistCm: waist ? Number(waist.replace(",", ".")) : null,
        hipCm: hip ? Number(hip.replace(",", ".")) : null,
        thighRelaxedCm: thigh ? Number(thigh.replace(",", ".")) : null,
        bicepsNormalCm: bicepsNormal ? Number(bicepsNormal.replace(",", ".")) : null,
        bicepsFlexedCm: bicepsFlexed ? Number(bicepsFlexed.replace(",", ".")) : null,
        chestCm: chest ? Number(chest.replace(",", ".")) : null,
        comment: comment.trim(),
      };
      const response = await fetch("/api/client/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as ApiResponse;
      setResult(data);
      if (response.ok) {
        location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panelHead"><h2>Registro de medidas</h2></div>
      <form className="stack" onSubmit={handleSubmit}>
        <div className="field"><label>Fecha</label><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required /></div>
        <div className="columns three">
          <div className="field"><label>Peso</label><input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} /></div>
          <div className="field"><label>Cintura</label><input value={waist} onChange={(e) => setWaist(e.target.value)} /></div>
          <div className="field"><label>Cadera</label><input value={hip} onChange={(e) => setHip(e.target.value)} /></div>
        </div>
        <div className="columns three">
          <div className="field"><label>Muslo relajado</label><input value={thigh} onChange={(e) => setThigh(e.target.value)} /></div>
          <div className="field"><label>Bíceps normal</label><input value={bicepsNormal} onChange={(e) => setBicepsNormal(e.target.value)} /></div>
          <div className="field"><label>Bíceps tensión</label><input value={bicepsFlexed} onChange={(e) => setBicepsFlexed(e.target.value)} /></div>
        </div>
        <div className="field"><label>Pecho</label><input value={chest} onChange={(e) => setChest(e.target.value)} /></div>
        <div className="field"><label>Comentario</label><textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar medidas"}</button>
      </form>
      {result ? <p className={result.success ? "success" : "error"}>{result.message}</p> : null}
    </section>
  );
}
