"use client";

import { useEffect, useState } from "react";
import { subscribePaginaPorSlug } from "@/lib/data";
import type { Pagina } from "@/types/conteudo";
import Markdown from "./Markdown";

// Página institucional (painel → Site público → Páginas). Chega pronta do servidor
// (SSR) e segue em tempo real: edição no painel aparece sem recarregar.
export default function PaginaConteudo({ inicial, slug }: { inicial: Pagina; slug: string }) {
  const [pagina, setPagina] = useState<Pagina | null>(inicial);
  useEffect(() => subscribePaginaPorSlug(slug, setPagina), [slug]);

  if (!pagina) return <div className="container vazio">Esta página não está mais publicada.</div>;
  return (
    <>
      <section className="pagina-cab">
        <div className="container">
          <h1>{pagina.titulo}</h1>
          {pagina.resumo && <p>{pagina.resumo}</p>}
        </div>
      </section>
      <section className="section pagina-corpo">
        <div className="container" style={{ maxWidth: 860 }}>
          {pagina.imagemUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pagina.imagemUrl} alt="" className="pagina-img" />
          )}
          <div className="markdown-body"><Markdown>{pagina.conteudo}</Markdown></div>
        </div>
      </section>
    </>
  );
}
