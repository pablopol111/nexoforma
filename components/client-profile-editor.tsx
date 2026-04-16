"use client";

import { FormEvent, useState } from "react";

type Props = {
  initialHeightCm: number | null;
  initialReferenceWeightKg: number | null;
  initialTargetWeightKg: number | null;
};

type ApiResponse = {
  success: boolean;
  message: string;
};

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && value !== "" ? parsed : null;
}

export function ClientProfileEditor({
  initialHeightCm,
  initialReferenceWeightKg,
  initialTargetWeightKg,
}: Props) {
  const [open, setOpen] = useState(false);
  const [heightCm, setHeightCm] = useState(initialHeightCm?.toString() ?? "");
  const [referenceWeightKg, setReferenceWeightKg] = useState(initialReferenceWeightKg?.toString() ?? "");
  const [targetWeightKg, setTargetWeightKg] = useState(initialTargetWeightKg?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/client/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm: toNumber(heightCm),
          referenceWeightKg: toNumber(referenceWeightKg),
          targetWeightKg: toNumber(targetWeightKg),
        }),
      });

      const data = (await response.json()) as ApiResponse;
      setResult(data);

      if (response.ok) {
        setOpen(false);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "No se pudo guardar.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panelHead split">
        <h2>Perfil</h2>
        <button className="secondary" type="button" onClick={() => setOpen((value) => !value)}>
          {open ? "Cerrar" : "Editar"}
        </button>
      </div>
      {!open ? <p className="mutedLine">Tus ajustes quedan guardados y ocultos hasta que vuelvas a abrirlos.</p> : null}
      {open ? (
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="heightCm">Altura</label>
            <input id="heightCm" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} placeholder="170" />
          </div>
          <div className="field">
            <label htmlFor="referenceWeightKg">Peso de referencia</label>
            <input id="referenceWeightKg" value={referenceWeightKg} onChange={(event) => setReferenceWeightKg(event.target.value)} placeholder="86.5" />
          </div>
          <div className="field">
            <label htmlFor="targetWeightKg">Peso objetivo</label>
            <input id="targetWeightKg" value={targetWeightKg} onChange={(event) => setTargetWeightKg(event.target.value)} placeholder="78" />
          </div>
          <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
        </form>
      ) : null}
      {result ? <p className={result.success ? "success" : "error"}>{result.message}</p> : null}
    </section>
  );
}