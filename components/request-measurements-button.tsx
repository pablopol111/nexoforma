"use client";

import { useState } from 'react';

export function RequestMeasurementsButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    const response = await fetch('/api/nutritionist/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    const data = await response.json();
    setMessage(data.message ?? null);
    setLoading(false);
  }

  return (
    <div className="stack">
      <button type="button" onClick={handleClick} disabled={loading}>{loading ? 'Enviando...' : 'Solicitar actualización'}</button>
      {message ? <p className="success">{message}</p> : null}
    </div>
  );
}
