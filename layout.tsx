import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buscador inteligente de Licitaciones",
  description: "Búsqueda semántica y filtrada de licitaciones públicas.",
  // Evita que el navegador ofrezca traducir la página (como hacía la app de Streamlit).
  other: { google: "notranslate" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" translate="no">
      <body>{children}</body>
    </html>
  );
}
