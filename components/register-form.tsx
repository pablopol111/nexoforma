"use client";

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidEmail, isValidPassword, isValidUsername, normalizeUsername } from '@/lib/utils';

type ApiResponse = { success: boolean; message: string };

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const normalizedUsername = useMemo(() => normalizeUsername(username), [username]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const cleanUsername = normalizeUsername(username);
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidUsername(cleanUsername)) return setResult({ success: false, message: 'Usuario no válido.' });
    if (!isValidEmail(cleanEmail)) return setResult({ success: false, message: 'Email no válido.' });
    if (!isValidPassword(password)) return setResult({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    setLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, fullName: fullName.trim(), clinicName: clinicName.trim(), email: cleanEmail, password, token: token.trim() }),
      });
      const data = (await response.json()) as ApiResponse;
      setResult(data);
      if (response.ok) setTimeout(() => router.push('/login'), 900);
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'No se pudo completar el registro.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="username">Usuario</label>
        <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <small>{normalizedUsername || 'usuario'}</small>
      </div>
      <div className="field">
        <label htmlFor="fullName">Nombre completo</label>
        <input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="clinicName">Clínica</label>
        <input id="clinicName" value={clinicName} onChange={(event) => setClinicName(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="token">Token de acceso</label>
        <input id="token" value={token} onChange={(event) => setToken(event.target.value)} required />
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Registrarse'}</button>
      {result ? <p className={result.success ? 'success' : 'error'}>{result.message}</p> : null}
    </form>
  );
}
