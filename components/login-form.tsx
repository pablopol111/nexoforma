"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeUsername } from "@/lib/utils";

type ApiResponse = {
  success: boolean;
  message: string;
  redirectTo?: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: normalizeUsername(username),
          password,
          next: searchParams.get("next"),
        }),
      });

      const data = (await response.json()) as ApiResponse;
      setResult(data);

      if (response.ok && data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "No se pudo iniciar sesión.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="username">Usuario</label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
      {result ? <p className={result.success ? "success" : "error"}>{result.message}</p> : null}
    </form>
  );
}