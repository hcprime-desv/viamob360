// CÓPIA gerada por scripts/aplicar-tema-sites.py — NÃO edite aqui: altere em packages/layout/src/sites e rode de novo.
// Padrão core360 (packages/layout/src/sites/temaSiteScript.ts) — FONTE ÚNICA; copiado para components/public/ dos sites por
// scripts/aplicar-tema-sites.py. SEM "use client": o app/layout.tsx (servidor) chama scriptTemaSite() no <head>.
export const CHAVE_TEMA_SITE = "tema-site";
type Padrao = "automatico" | "claro" | "escuro";

/** Script do <head>: aplica o tema ANTES de pintar a página (sem piscar claro). */
/** Padrão ESCURO (dono, 11/11/2026: todo site abre escuro); a escolha do visitante (botão sol/lua) fica no navegador dele. */
export function scriptTemaSite(padrao: Padrao = "escuro"): string {
  return `(function(){try{var t=${JSON.stringify(padrao)},e=localStorage.getItem(${JSON.stringify(CHAVE_TEMA_SITE)});`
    + `if(e!=="claro"&&e!=="escuro")e=t==="automatico"?(matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro"):t;`
    + `document.documentElement.setAttribute("data-tema",e)}catch(_){}})();`;
}

