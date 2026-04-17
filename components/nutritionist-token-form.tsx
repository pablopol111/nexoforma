"use client";

import { FormEvent, useState } from 'react';

type ApiResponse = { success: boolean; message: string; token?: string };

export function NutritionistTokenForm() {
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/nutritionist/tokens/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: Number(expiresInDays) }),
      });
      const data = (await response.json()) as ApiResponse;
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel stack">
      <div className="panelHead"><h2>Token de cliente</h2></div>
      <form className="inlineForm" onSubmit={handleSubmit}>
        <input type="number" min={1} max={365} value={expiresInDays} onChange={(event) => setExpiresInDays(event.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Generando...' : 'Generar token'}</button>
      </form>
      {result ? <div className="stack"><p className={result.success ? 'success' : 'error'}>{result.message}</p>{result.token ? <code className="tokenBox">{result.token}</code> : null}</div> : null}
    </section>
  );
}
