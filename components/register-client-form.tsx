"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
} from "@/lib/utils";

type ApiResponse = {
  success: boolean;
  message: string;
};

export function RegisterClientForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<ApiResponse | null>(null);

  const normalizedUsername = useMemo(() => normalizeUsername(username), [username]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const cleanUsername = normalizeUsername(username);
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidUsername(cleanUsername)) {
      setMessage({
        success: false,
        message:
          "El usuario debe tener entre 3 y 30 caracteres y solo puede incluir letras minúsculas, números, punto, guion o guion bajo.",
      });
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessage({
        success: false,
        message: "Introduce un email válido.",
      });
      return;
    }

    if (!isValidPassword(password)) {
      setMessage({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          fullName: fullName.trim(),
          email: cleanEmail,
          password,
          token: token.trim(),
        }),
      });

      const data = (await response.json()) as ApiResponse;
      setMessage(data);

      if (response.ok) {
        setUsername("");
        setFullName("");
        setEmail("");
        setPassword("");
        setToken("");

        setTimeout(() => {
          router.push("/login");
        }, 1200);
      }
    } catch (error) {
      setMessage({
        success: false,
        message:
          error instanceof Error ? error.message : "No se pudo completar el registro.",
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
          placeholder="juan.cliente"
          required
        />
        <small>
          Se guardará como <strong>{normalizedUsername || "usuario"}</strong>
        </small>
      </div>

      <div className="field">
        <label htmlFor="fullName">Nombre completo</label>
        <input
          id="fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          placeholder="Juan Pérez"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="email">Email interno</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="juan@correo.com"
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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="token">Token de invitación</label>
        <input
          id="token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="NEXO-CLIENT-XXXXXXXXXXXX"
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Registrando..." : "Crear cuenta"}
      </button>

      {message && (
        <p className={message.success ? "success" : "error"}>{message.message}</p>
      )}
    </form>
  );
}
