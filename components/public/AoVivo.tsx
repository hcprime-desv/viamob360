"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { subscribeConfiguracao, subscribePaginasPublicadas, subscribePerguntas } from "@/lib/data";
import type { Cidade, Configuracao, Pagina, Pergunta } from "@/types/conteudo";

// Dados ao vivo do site (padrão portal181/PetHub): o servidor manda o estado
// atual no HTML e, no navegador, listeners (onSnapshot) mantêm configuração,
// páginas e perguntas sincronizadas com o painel — editou, muda na tela.
// Também guarda a CIDADE escolhida no seletor do topo (localStorage).
type Estado = {
  configuracao: Configuracao; paginas: Pagina[]; perguntas: Pergunta[];
  cidades: Cidade[]; cidade: Cidade | null; escolherCidade: (path: string) => void;
};
const Contexto = createContext<Estado | null>(null);
const CHAVE_CIDADE = "viamob_cidade";

export function AoVivoProvider({ configuracao, paginas, perguntas, cidades, children }: {
  configuracao: Configuracao; paginas: Pagina[]; perguntas: Pergunta[]; cidades: Cidade[]; children: React.ReactNode;
}) {
  const [c, setC] = useState(configuracao);
  const [p, setP] = useState(paginas);
  const [q, setQ] = useState(perguntas);
  const [cidade, setCidade] = useState<Cidade | null>(cidades[0] ?? null);
  useEffect(() => subscribeConfiguracao(setC), []);
  useEffect(() => subscribePaginasPublicadas(setP), []);
  useEffect(() => subscribePerguntas(setQ), []);
  useEffect(() => {
    try {
      const salva = cidades.find((x) => x.path === localStorage.getItem(CHAVE_CIDADE));
      if (salva) setCidade(salva);
    } catch { /* sem storage */ }
  }, [cidades]);
  const escolherCidade = (path: string) => {
    const nova = cidades.find((x) => x.path === path) ?? null;
    setCidade(nova);
    try { if (nova) localStorage.setItem(CHAVE_CIDADE, nova.path); } catch { /* idem */ }
  };
  // Cores da Configuração do site sobrescrevem --blue/--green (globals.css).
  const tema = { ["--blue" as any]: c.corPrimaria, ["--green" as any]: c.corDestaque } as React.CSSProperties;
  return (
    <Contexto.Provider value={{ configuracao: c, paginas: p, perguntas: q, cidades, cidade, escolherCidade }}>
      <div style={tema}>{children}</div>
    </Contexto.Provider>
  );
}

function useAoVivo(): Estado {
  const e = useContext(Contexto);
  if (!e) throw new Error("useAoVivo fora do AoVivoProvider (app/(public)/layout.tsx).");
  return e;
}
export const useConfiguracao = () => useAoVivo().configuracao;
export const usePaginas = () => useAoVivo().paginas;
export const usePerguntas = () => useAoVivo().perguntas;
export const useCidades = () => { const e = useAoVivo(); return { cidades: e.cidades, cidade: e.cidade, escolherCidade: e.escolherCidade }; };
