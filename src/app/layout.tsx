import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-serif/500.css";
import "@fontsource/ibm-plex-serif/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buscador inteligente de Licitaciones",
  description: "Búsqueda semántica y filtrada de licitaciones públicas.",
  // Evita que el navegador ofrezca traducir la página (como hacía la app de Streamlit).
  other: { google: "notranslate" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" translate="no">
      <body>{children}</body>
    </html>
  );
}
