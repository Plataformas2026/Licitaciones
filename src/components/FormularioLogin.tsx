"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client.ts";
import { Cargando, IconoOjo, IconoOjoTachado } from "./icons.tsx";
import { Aviso, botonPrimario, campo, etiqueta } from "./ui.tsx";

function traducirError(mensaje: string, estado?: number): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Tu correo todavía no está confirmado. Revisa tu bandeja de entrada.";
  if (estado === 429 || m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
  if (m.includes("failed to fetch") || m.includes("network")) return "No se pudo conectar. Comprueba tu conexión.";
  return "No se pudo iniciar sesión. Inténtalo de nuevo.";
}

export function FormularioLogin({ destino }: { destino: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alEnviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);

    try {
      const { error: err } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(traducirError(err.message, err.status));
        setEnviando(false);
        return;
      }
      router.replace(destino);
      router.refresh();
    } catch (ex) {
      setError(traducirError(ex instanceof Error ? ex.message : ""));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="space-y-5" noValidate={false}>
      <div>
        <label htmlFor="email" className={etiqueta}>
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@empresa.com"
          className={`${campo} py-2.5 text-base`}
        />
      </div>

      <div>
        <label htmlFor="password" className={etiqueta}>
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${campo} py-2.5 pr-11 text-base`}
          />
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
          >
            {verPassword ? <IconoOjoTachado /> : <IconoOjo />}
          </button>
        </div>
      </div>

      {error && (
        <Aviso tipo="error" rol="alert">
          {error}
        </Aviso>
      )}

      <button type="submit" disabled={enviando} className={`${botonPrimario} w-full py-3 text-base`}>
        {enviando && <Cargando />}
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
