"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiResponse = { success: boolean; message: string; token?: string };

type Props = {
  remainingCapacity: number;
};

export function NutritionistTokenForm({ remainingCapacity }: Props) {
  const router = useRouter();
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (loading || remainingCapacity <= 0) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/nutritionist/tokens/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as ApiResponse;
      setResult(data);
      if (data.success) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panelHead split wrapOnMobile">
        <div className="stack compactStack">
          <h2>Token de cliente</h2>
          <p className="mutedLine">
            Genera un token por cada plaza libre real. Cuando un token se usa en un registro, deja de contar como pendiente.
          </p>
        </div>
        <div className="actionCluster alignEnd">
          <span className={`chip ${remainingCapacity > 0 ? "ok" : "warn"}`}>
            {remainingCapacity > 0 ? `${remainingCapacity} plaza${remainingCapacity === 1 ? "" : "s"} libre${remainingCapacity === 1 ? "" : "s"}` : "Sin plazas libres"}
          </span>
          <button type="button" onClick={handleGenerate} disabled={loading || remainingCapacity <= 0}>
            {loading ? "Generando..." : "Generar token"}
          </button>
        </div>
      </div>
      {result ? (
        <div className="stack">
          <p className={result.success ? "success" : "error"}>{result.message}</p>
          {result.token ? <code className="tokenBox">{result.token}</code> : null}
        </div>
      ) : null}
    </section>
  );
}
