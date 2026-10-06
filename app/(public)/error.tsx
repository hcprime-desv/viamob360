"use client";

import Link from "next/link";
import { useEffect } from "react";

// Falha ao ler o Firebase (ou outro erro inesperado) numa página do site.
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[viamob360] erro na página", error);
  }, [error]);
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640, textAlign: "center" }}>
        <h1 className="h2-grande">Não foi possível carregar esta página</h1>
        <p className="texto-mut" style={{ margin: "0 auto" }}>Tente de novo em instantes. Se continuar, fale com a gente.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-primary" onClick={reset}>Tentar de novo</button>
          <Link href="/" className="btn btn-outline">Ir para o início</Link>
        </div>
      </div>
    </section>
  );
}
