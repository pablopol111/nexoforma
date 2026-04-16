"use client";

import { FormEvent, useState } from "react";

type ApiResponse = {
  success: boolean;
  message: string;
  token?: string;
};

export function NutritionistTokenForm() {
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/nutritionist/tokens/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: Number(days) }),
      });

      const data = (await response.json()) as ApiResponse;
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "No se pudo generar el token.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!result?.token) return;
    await navigator.clipboard.writeText(result.token);
  }

  return (
    <section className="panel stack">
      <div className="panelHead">
        <h2>Nuevo token de cliente</h2>
      </div>
      <form className="inlineForm" onSubmit={handleSubmit}>
        <input type="number" min={1} max={365} value={days} onChange={(event) => setDays(event.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Generando..." : "Generar"}</button>
      </form>
      {result?.success && result.token ? (
        <div className="tokenBox">
          <strong>{result.token}</strong>
          <button className="secondary" type="button" onClick={copyToken}>Copiar</button>
        </div>
      ) : null}
      {result && !result.success ? <p className="error">{result.message}</p> : null}
    </section>
  );
}