"use client";
// CÓPIA gerada por scripts/aplicar-tema-sites.py — NÃO edite aqui: altere em packages/layout/src/sites e rode de novo.
// Padrão core360 (packages/layout/src/sites/TemaSite.tsx) — FONTE ÚNICA; os sites recebem uma cópia em
// components/public/TemaSite.tsx por `python scripts/aplicar-tema-sites.py` (sites não usam @hc/*). Só React + lucide-react.
//
// Tema claro/escuro de site SEM tema próprio: <html data-tema="claro|escuro">. O visitante troca no botão sol/lua (fica no
// navegador dele); sem escolha, segue o aparelho (ou o padrão passado). As cores do escuro vêm do CSS do monorepo
// (tema-escuro-base.css + tema-escuro-azul.css, no fim do app/globals.css).
//   app/layout.tsx:  <html ... data-tema="claro" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: scriptTemaSite() }} /></head>
//                    (scriptTemaSite vem de ./temaSiteScript — sem "use client", o layout roda no servidor)
//   Header:          <BotaoTemaSite />
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { CHAVE_TEMA_SITE } from "./temaSiteScript";

/** Botão do topo (sol/lua). `className` = a classe dos ícones do topo do site (ex.: "busca"). */
export function BotaoTemaSite({ className = "busca botao-tema" }: { className?: string }) {
  const [escuro, setEscuro] = useState(false);
  useEffect(() => { setEscuro(document.documentElement.getAttribute("data-tema") === "escuro"); }, []);
  const alternar = () => {
    const t = escuro ? "claro" : "escuro";
    try { localStorage.setItem(CHAVE_TEMA_SITE, t); } catch { /* sem storage */ }
    document.documentElement.setAttribute("data-tema", t);
    setEscuro(!escuro);
  };
  return (
    <button type="button" className={className} onClick={alternar} aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"} title={escuro ? "Tema claro" : "Tema escuro"} style={{ background: "none", border: 0, cursor: "pointer" }}>
      {escuro ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
