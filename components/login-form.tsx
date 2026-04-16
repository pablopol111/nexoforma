"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeUsername } from "@/lib/utils";

type VisibleRole = "nutritionist" | "client" | "admin";

type ApiResponse = {
  success: boolean;
  message: string;
  redirectTo?: string;
};

const ROLE_COPY: Record<VisibleRole, { title: string; text: string }> = {
  nutritionist: {
    title: "Soy nutricionista",
    text: "Acceso profesional para gestión de pacientes y generación de tokens de cliente.",
  },
  client: {
    title: "Soy cliente",
    text: "Acceso personal para revisar evolución, progreso y seguimiento de peso.",
  },
  admin: {
    title: "Acceso de administración",
    text: "Uso interno para creación de invitaciones de nutricionista y control general.",
  },
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [selectedRole, setSelectedRole] = useState<VisibleRole>("nutritionist");
  const [showAdminOption, setShowAdminOption] = useState(false);
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
          selectedRole,
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
        message: error instanceof Error ? error.message : "No se pudo iniciar sesión.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label>Selecciona tu acceso</label>
        <div className="roleSelector">
          {(["nutritionist", "client"] as const).map((role) => (
            <button
              key={role}
              type="button"
              className={`roleButton ${selectedRole === role ? "active" : ""}`}
              onClick={() => setSelectedRole(role)}
            >
              <span className="roleButtonTitle">{ROLE_COPY[role].title}</span>
              <span className="roleButtonText">{ROLE_COPY[role].text}</span>
            </button>
          ))}
        </div>
        <div className="roleAssist">
          <span className="muted">
            El acceso visible se valida después contra tu perfil real en Supabase.
          </span>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              const nextValue = !showAdminOption;
              setShowAdminOption(nextValue);
              if (!nextValue && selectedRole === "admin") {
                setSelectedRole("nutritionist");
              }
            }}
          >
            {showAdminOption ? "Ocultar admin" : "Acceso admin"}
          </button>
        </div>

        {showAdminOption && (
          <button
            type="button"
            className={`roleButton ${selectedRole === "admin" ? "active" : ""}`}
            onClick={() => setSelectedRole("admin")}
          >
            <span className="roleButtonTitle">{ROLE_COPY.admin.title}</span>
            <span className="roleButtonText">{ROLE_COPY.admin.text}</span>
          </button>
        )}
      </div>

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
        {loading ? "Entrando..." : `Entrar como ${ROLE_COPY[selectedRole].title.toLowerCase()}`}
      </button>

      {message && <p className={message.success ? "success" : "error"}>{message.message}</p>}
    </form>
  );
}
