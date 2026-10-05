"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client.ts";
import { Cargando, IconoSalir } from "./icons.tsx";

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    try {
      await createClient().auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-1.5 font-medium text-ink hover:bg-paper disabled:opacity-60"
    >
      {saliendo ? <Cargando /> : <IconoSalir />}
      Cerrar sesión
    </button>
  );
}
