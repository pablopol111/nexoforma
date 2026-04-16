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
  const nextPath = searchParams.get("next");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<ApiResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: normalizeUsername(username),
          password,
          next: nextPath,
        }),
      });

      const data = (await response.json()) as ApiResponse;
      setMessage(data);

      if (response.ok && data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } catch (error) {
      setMessage({
        success: false,
        message:
          error instanceof Error ? error.message : "No se pudo iniciar sesión.",
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
          placeholder="tu.usuario"
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
          placeholder="Tu contraseña"
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Iniciar sesión"}
      </button>

      {message && (
        <p className={message.success ? "success" : "error"}>{message.message}</p>
      )}
    </form>
  );
}
