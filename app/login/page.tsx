"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { roleToPath, usernameToEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const email = usernameToEmail(username);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        return;
      }

      router.push(redirectedFrom || roleToPath(profile.role));
      router.refresh();
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="container">
        <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
          <h1 className="title">Acceso a NexoForma</h1>
          <p className="subtitle">Inicia sesión con usuario y contraseña.</p>

          <form className="stack" onSubmit={onSubmit} style={{ marginTop: 24 }}>
            <div className="field">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                name="username"
                placeholder="ejemplo.nutri"
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
                name="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "Accediendo..." : "Entrar"}
            </button>
          </form>

          <div className="links">
            <Link className="linkCard" href="/register/nutritionist">
              ¿No tienes acceso? Registrar nutricionista con token
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
