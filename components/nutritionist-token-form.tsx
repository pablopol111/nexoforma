"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

type TokenRow = {
  id: string;
  token: string;
  status: "available" | "used" | "revoked";
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  token?: string;
  remainingSlots?: number;
  tokens?: TokenRow[];
};

export function NutritionistTokenForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);

  async function loadTokens() {
    const response = await fetch('/api/nutritionist/tokens/client', { cache: 'no-store' });
    const data = (await response.json()) as ApiResponse;
    if (data.success) {
      setTokens(data.tokens ?? []);
      setRemainingSlots(data.remainingSlots ?? null);
    }
  }

  useEffect(() => { void loadTokens(); }, []);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);
    const response = await fetch('/api/nutritionist/tokens/client', { method: 'POST' });
    const data = (await response.json()) as ApiResponse;
    setLoading(false);
    setMessage(data.message ?? null);
    await loadTokens();
  }

  return (
    <section className="panel stack">
      <div className="panelHead split">
        <div>
          <h2>Tokens de cliente</h2>
          <p>Genera un token y controla el histórico completo desde la misma vista.</p>
        </div>
        <div className="tokenActions">
          <div className="chip">Huecos disponibles: {remainingSlots ?? '-'}</div>
          <button type="button" onClick={handleGenerate} disabled={loading}>{loading ? 'Generando...' : 'Generar token'}</button>
        </div>
      </div>
      {message ? <p className={message.toLowerCase().includes('alcanzado') ? 'error' : 'success'}>{message}</p> : null}
      <div className="tableWrap">
        <table>
          <thead><tr><th>Token</th><th>Estado</th><th>Creado</th><th>Usado</th><th>Caduca</th></tr></thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td><code>{token.token}</code></td>
                <td><span className={`statusPill ${token.status}`}>{token.status === 'available' ? 'Disponible' : token.status === 'used' ? 'Usado' : 'Revocado'}</span></td>
                <td>{formatDateTime(token.created_at)}</td>
                <td>{formatDateTime(token.used_at)}</td>
                <td>{formatDateTime(token.expires_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
