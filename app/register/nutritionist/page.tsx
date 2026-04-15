"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type RegisterResponse = {
  success: boolean;
  message: string;
};

export default function RegisterNutritionistPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/register/nutritionist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          username,
          password,
          accessToken
        })
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        setResult({
          success: false,
          message: data.message || "No se pudo completar el registro."
        });
        return;
      }

      setResult(data);
      setFullName("");
      setUsername("");
      setPassword("");
      setAccessToken("");
    } catch (error) {
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Se produjo un error inesperado."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="container">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 className="title">Registro de nutricionista</h1>
          <p className="subtitle">
            Alta con usuario, contraseña y token de acceso entregado por administración.
          </p>

          <form className="stack" onSubmit={onSubmit} style={{ marginTop: 24 }}>
            <div className="field">
              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Nombre y apellidos"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="usuario.nutri"
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
                placeholder="Crea una contraseña"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="accessToken">Token de acceso</label>
              <input
                id="accessToken"
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
                placeholder="NEXO-NUTRI-2026"
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          {result ? (
            <p
              style={{
                marginTop: 16,
                color: result.success ? "#166534" : "#b91c1c"
              }}
            >
              {result.message}
            </p>
          ) : null}

          <div className="links">
            <Link className="linkCard" href="/login">
              Ir al login
            </Link>
            <Link className="linkCard" href="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
