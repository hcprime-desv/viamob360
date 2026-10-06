"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { subscribeAvisosAtivos } from "@/lib/data";
import { ehExterno } from "@/lib/util";
import type { Aviso } from "@/types/conteudo";
import Markdown from "./Markdown";

// Avisos do painel (Site público → Avisos): no máximo uma faixa no topo e uma
// janela (modal) por vez — o de menor `ordem` de cada formato. Fechar grava
// id+versão no localStorage: quem fechou não vê de novo até o aviso ser
// editado no painel (a versão muda) ou um aviso novo ser criado.
const chave = (a: Aviso) => `viamob_aviso_${a.id}_${a.versao}`;
const foiFechado = (a: Aviso) => { try { return localStorage.getItem(chave(a)) === "1"; } catch { return false; } };
const marcarFechado = (a: Aviso) => { try { localStorage.setItem(chave(a), "1"); } catch { /* aba anônima: fecha só nesta visita */ } };

function LinkAviso({ aviso, className }: { aviso: Aviso; className: string }) {
  if (!aviso.linkUrl) return null;
  const texto = aviso.linkTexto || "Saiba mais";
  return ehExterno(aviso.linkUrl)
    ? <a href={aviso.linkUrl} className={className} target="_blank" rel="noreferrer">{texto}</a>
    : <Link href={aviso.linkUrl} className={className}>{texto}</Link>;
}

export default function AvisosClient({ avisosIniciais }: { avisosIniciais: Aviso[] }) {
  const [avisos, setAvisos] = useState<Aviso[]>(avisosIniciais);
  const [fechados, setFechados] = useState<Set<string> | null>(null); // null = ainda não leu o localStorage (evita piscar no SSR)

  useEffect(() => subscribeAvisosAtivos(setAvisos), []);
  useEffect(() => setFechados(new Set(avisos.filter(foiFechado).map(chave))), [avisos]);

  if (!fechados) return null;
  const faixa = avisos.find((a) => a.tipo === "faixa" && !fechados.has(chave(a)));
  const modal = avisos.find((a) => a.tipo === "modal" && !fechados.has(chave(a)));
  const fechar = (a: Aviso) => { marcarFechado(a); setFechados(new Set([...fechados, chave(a)])); };

  return (
    <>
      {faixa && (
        <div className="aviso-faixa" role="region" aria-label="Aviso">
          <div className="container">
            <div className="texto"><strong>{faixa.titulo}</strong> — <Markdown inline>{faixa.mensagem}</Markdown></div>
            <LinkAviso aviso={faixa} className="link" />
            <button type="button" onClick={() => fechar(faixa)} aria-label="Fechar aviso"><X size={18} /></button>
          </div>
        </div>
      )}
      {modal && (
        <div className="modal-fundo" onClick={() => fechar(modal)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby={`aviso-${modal.id}`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="fechar" onClick={() => fechar(modal)} aria-label="Fechar aviso"><X size={20} /></button>
            {modal.imagemUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={modal.imagemUrl} alt="" />
            )}
            <div className="corpo-m">
              <h2 id={`aviso-${modal.id}`}>{modal.titulo}</h2>
              <div className="markdown-body"><Markdown>{modal.mensagem}</Markdown></div>
              <div className="hero-actions" style={{ marginTop: 18 }}>
                <LinkAviso aviso={modal} className="btn btn-primary" />
                <button type="button" className="btn btn-outline" onClick={() => fechar(modal)}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
