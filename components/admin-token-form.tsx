"use client";

import { FormEvent, useState } from "react";

type ApiResponse = {
  success: boolean;
  message: string;
  token?: string;
};

export function AdminTokenForm() {
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/tokens/nutritionist", {
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
    <section className="sectionCard stack">
      <div className="panelHeader">
        <div>
          <span className="badge">Invitación</span>
          <h2 className="pageSectionTitle">Generar token de nutricionista</h2>
          <p className="pageSectionSubtitle">
            Crea una invitación con caducidad controlada para el alta de un nuevo profesional.
          </p>
        </div>
      </div>

      <form className="formGrid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="expiresInDays">Caducidad en días</label>
          <input
            id="expiresInDays"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            required
          />
        </div>
        <div className="field" style={{ alignSelf: "end" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Generando..." : "Generar token"}
          </button>
        </div>
      </form>

      {result ? (
        result.success && result.token ? (
          <div className="tokenResult">
            <div>
              <p className="success" style={{ marginBottom: 0 }}>{result.message}</p>
            </div>
            <div className="tokenCode">{result.token}</div>
            <div className="actionRow">
              <button className="secondary" type="button" onClick={copyToken}>
                Copiar token
              </button>
            </div>
          </div>
        ) : (
          <p className="error">{result.message}</p>
        )
      ) : null}
    </section>
  );
}
