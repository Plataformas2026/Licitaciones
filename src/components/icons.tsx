import type { ReactNode, SVGProps } from "react";

function Icono({ children, ...p }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.1em"
      height="1.1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...p}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IconoBuscar = (p: P) => (
  <Icono {...p}>
    <circle cx="11" cy="11" r="7.5" />
    <path d="m21 21-4.3-4.3" />
  </Icono>
);
export const IconoNovedades = (p: P) => (
  <Icono {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 16v4M17 18h4" />
  </Icono>
);
export const IconoLimpiar = (p: P) => (
  <Icono {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Icono>
);
export const IconoSalir = (p: P) => (
  <Icono {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Icono>
);
export const IconoOjo = (p: P) => (
  <Icono {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icono>
);
export const IconoOjoTachado = (p: P) => (
  <Icono {...p}>
    <path d="M10.7 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </Icono>
);
export const IconoEnlace = (p: P) => (
  <Icono {...p}>
    <path d="M15 3h6v6M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Icono>
);
export const IconoAlerta = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icono>
);
export const IconoOk = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m8 12 3 3 5-6" />
  </Icono>
);
export const IconoInfo = (p: P) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Icono>
);
export const IconoChevron = (p: P) => (
  <Icono {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icono>
);
export const IconoRama = (p: P) => (
  <Icono {...p} strokeWidth="1.75">
    <path d="M6 4v9a3 3 0 0 0 3 3h8" />
    <path d="m14 13 3 3-3 3" />
  </Icono>
);

/** Marca: lupa sobre cuadrado de color de marca. */
export function Marca({ tamano = 32 }: { tamano?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={tamano} height={tamano} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0b5fc4" />
      <circle cx="14" cy="14" r="6.5" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="m19 19 7 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Cargando({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1.1em"
      height="1.1em"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ animation: "girar 0.8s linear infinite" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
