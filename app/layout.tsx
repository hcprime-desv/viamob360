import type { Metadata } from "next";
import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import { listarConfiguracao } from "@/lib/data";

// Títulos em Poppins (geométrica pesada, como em site_principal.png); texto em Inter.
const titulo = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--fonte-titulo", display: "swap" });
const texto = Inter({ subsets: ["latin"], variable: "--fonte-texto", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const c = await listarConfiguracao();
  return {
    title: { default: c.seoTitulo || c.nomeSite, template: `%s | ${c.nomeSite}` },
    description: c.seoDescricao || c.slogan,
    icons: c.faviconUrl ? { icon: c.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
