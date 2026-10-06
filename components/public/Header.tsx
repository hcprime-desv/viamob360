"use client";

// Cabeçalho (site_principal.png): logo, menu por público, busca na Ajuda e
// "Baixar App". Sem área de prefeitura (tudo da prefeitura é no painel).
// Páginas do painel com local "menu" entram no fim do menu.
import Link from "next/link";
import { useState } from "react";
import { Download, Menu, Search, X } from "lucide-react";
import { useConfiguracao, usePaginas } from "./AoVivo";
import { useChat } from "@/components/chat/ChatCentral";
import { useFormularios } from "@/components/forms/Formularios";
import { linkSecao } from "@/lib/util";

export const LINKS_MENU = [
  { rotulo: "Início", secao: "inicio" },
  { rotulo: "Como Funciona", secao: "como-funciona" },
  { rotulo: "Passageiro", secao: "passageiros" },
  { rotulo: "Motorista Parceiro", secao: "motoristas" },
  { rotulo: "Empresas", secao: "empresas" },
  { rotulo: "Segurança", secao: "seguranca" },
];

export function LogoMarca({ branco = false }: { branco?: boolean }) {
  const c = useConfiguracao();
  const src = branco ? c.logoRodapeUrl || c.logoUrl || "/images/logo-viamob360-branco.png" : c.logoUrl || "/images/logo-viamob360.png";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={c.nomeSite} className={branco && !c.logoRodapeUrl && c.logoUrl ? "logo-clara" : undefined} />;
}

export default function Header() {
  const c = useConfiguracao();
  const paginas = usePaginas().filter((p) => p.local === "menu");
  const { abrir } = useChat();
  const formularios = useFormularios();
  const [aberto, setAberto] = useState(false);
  const app = c.googlePlayUrl || c.appStoreUrl || linkSecao("baixar");
  const fechar = () => setAberto(false);
  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" href="/" aria-label={`${c.nomeSite} — início`}><LogoMarca /></Link>
        <nav className={`links${aberto ? " aberto" : ""}`} aria-label="Menu principal">
          {LINKS_MENU.map((l, i) => (
            <a key={l.secao} href={linkSecao(l.secao)} className={i === 0 ? "ativo" : undefined} onClick={fechar}>{l.rotulo}</a>
          ))}
          <button type="button" onClick={() => { fechar(); abrir(); }}>Central</button>
          <button type="button" onClick={() => { fechar(); formularios.abrir("contato"); }}>Contato</button>
          {paginas.map((p) => <Link key={p.id} href={`/paginas/${p.slug}`} onClick={fechar}>{p.titulo}</Link>)}
          <a className="btn btn-primary so-mobile" href={app} onClick={fechar}><Download size={18} /> Baixar App</a>
        </nav>
        <div className="nav-actions">
          <a className="busca" href={linkSecao("ajuda")} aria-label="Buscar nas perguntas frequentes"><Search size={19} /></a>
          <a className="btn btn-primary btn-baixar" href={app}><Download size={19} /> Baixar App</a>
        </div>
        <button className="menu-btn" type="button" onClick={() => setAberto((v) => !v)} aria-label={aberto ? "Fechar menu" : "Abrir menu"} aria-expanded={aberto}>
          {aberto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </header>
  );
}
