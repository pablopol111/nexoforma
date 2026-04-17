"use client";

import { FormEvent, useMemo, useState } from "react";
import { toNullableNumber } from "@/lib/utils";

type Props = {
  initialFirstName: string | null;
  initialLastName: string | null;
  initialAge: number | null;
  initialSex: "male" | "female" | null;
  initialHeightCm: number | null;
  initialReferenceWeightKg: number | null;
  initialTargetWeightKg: number | null;
};

type ApiResponse = { success: boolean; message: string; profileCompleted?: boolean };

export function ClientProfileEditor(props: Props) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(props.initialFirstName ?? "");
  const [lastName, setLastName] = useState(props.initialLastName ?? "");
  const [age, setAge] = useState(props.initialAge?.toString() ?? "");
  const [sex, setSex] = useState(props.initialSex ?? "");
  const [heightCm, setHeightCm] = useState(props.initialHeightCm?.toString() ?? "");
  const [referenceWeightKg, setReferenceWeightKg] = useState(props.initialReferenceWeightKg?.toString() ?? "");
  const [targetWeightKg, setTargetWeightKg] = useState(props.initialTargetWeightKg?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const missing = useMemo(() => ({
    height: !heightCm.trim(),
    target: !targetWeightKg.trim(),
  }), [heightCm, targetWeightKg]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/client/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          age: toNullableNumber(age),
          sex: sex || null,
          heightCm: toNullableNumber(heightCm),
          referenceWeightKg: toNullableNumber(referenceWeightKg),
          targetWeightKg: toNullableNumber(targetWeightKg),
        }),
      });
      const data = (await response.json()) as ApiResponse;
      setResult(data);
      if (response.ok) {
        setOpen(false);
        location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="perfil" className="panel stack">
      <div className="panelHead split">
        <h2>Perfil</h2>
        <button className="secondary" type="button" onClick={() => setOpen((v) => !v)}>{open ? "Cerrar" : "Editar"}</button>
      </div>
      {!open ? (
        <div className="profileGrid">
          <article className="miniCard"><span>Nombre</span><strong>{firstName || "-"}</strong></article>
          <article className="miniCard"><span>Apellidos</span><strong>{lastName || "-"}</strong></article>
          <article className="miniCard"><span>Edad</span><strong>{age || "-"}</strong></article>
          <article className="miniCard"><span>Sexo</span><strong>{sex === "male" ? "Masculino" : sex === "female" ? "Femenino" : "-"}</strong></article>
          <article className="miniCard"><span>Altura</span><strong>{heightCm || "Pendiente"}</strong>{missing.height ? <small className="warningText">Altura pendiente</small> : null}</article>
          <article className="miniCard"><span>Peso de referencia</span><strong>{referenceWeightKg ? `${referenceWeightKg} kg` : "-"}</strong></article>
          <article className="miniCard"><span>Peso objetivo</span><strong>{targetWeightKg ? `${targetWeightKg} kg` : "-"}</strong>{missing.target ? <small className="warningText">Peso objetivo pendiente</small> : null}</article>
        </div>
      ) : (
        <form className="stack" onSubmit={handleSubmit}>
          <div className="columns two">
            <div className="field"><label>Nombre</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
            <div className="field"><label>Apellidos</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
          </div>
          <div className="columns three">
            <div className="field"><label>Edad</label><input value={age} onChange={(e) => setAge(e.target.value)} required /></div>
            <div className="field"><label>Sexo</label><select value={sex} onChange={(e) => setSex(e.target.value)} required><option value="">Selecciona</option><option value="male">Masculino</option><option value="female">Femenino</option></select></div>
            <div className="field"><label>Altura</label><input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} /></div>
          </div>
          <div className="columns two">
            <div className="field"><label>Peso de referencia</label><input value={referenceWeightKg} onChange={(e) => setReferenceWeightKg(e.target.value)} required /></div>
            <div className="field"><label>Peso objetivo</label><input value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} /></div>
          </div>
          <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar perfil"}</button>
        </form>
      )}
      {result ? <p className={result.success ? "success" : "error"}>{result.message}</p> : null}
    </section>
  );
}
