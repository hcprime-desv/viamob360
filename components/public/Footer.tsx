"use client";

// Rodapé (site_principal.png): logo branco, colunas, redes, lojas do app e a
// linha final com cidade, termos e privacidade. Páginas do painel com local
// "rodapé" entram na coluna Institucional.
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { useCidades, useConfiguracao, usePaginas } from "./AoVivo";
import { LogoMarca } from "./Header";
import { useChat } from "@/components/chat/ChatCentral";
import { useFormularios } from "@/components/forms/Formularios";
import { linkSecao } from "@/lib/util";

const ICONES = { instagram: Instagram, facebook: Facebook, linkedin: Linkedin, youtube: Youtube };

export function Lojas({ escuro = false }: { escuro?: boolean }) {
  const c = useConfiguracao();
  const loja = (href: string | null, topo: string, nome: string, icone: string) => (
    <a className={`loja${escuro ? " escuro" : ""}`} href={href || linkSecao("baixar")} target={href ? "_blank" : undefined} rel="noreferrer" aria-label={`${topo} ${nome}`}>
      <span className="loja-ic" aria-hidden>{icone}</span><span><small>{topo}</small><b>{nome}</b></span>
    </a>
  );
  return (
    <div className="lojas">
      {loja(c.appStoreUrl, "Baixar na", "App Store", "")}
      {loja(c.googlePlayUrl, "Disponível no", "Google Play", "▶")}
    </div>
  );
}

export default function Footer() {
  const c = useConfiguracao();
  const paginas = usePaginas().filter((p) => p.local === "rodape");
  const { cidade } = useCidades();
  const { abrir } = useChat();
  const formularios = useFormularios();
  const pagina = (slug: string, rotulo: string) => {
    const p = paginas.find((x) => x.slug === slug);
    return p ? <Link href={`/paginas/${p.slug}`}>{rotulo}</Link> : null;
  };
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-marca">
            <LogoMarca branco />
            <p>{c.textoRodape}</p>
            {c.redes.length > 0 && (
              <div className="redes">
                {c.redes.map((r) => { const I = ICONES[r.rede]; return <a key={r.rede} href={r.url} target="_blank" rel="noreferrer" aria-label={r.rede}><I size={20} /></a>; })}
              </div>
            )}
          </div>
          <div><h4>Plataforma</h4><a href={linkSecao("como-funciona")}>Como Funciona</a><a href={linkSecao("passageiros")}>Passageiro</a><a href={linkSecao("motoristas")}>Motorista Parceiro</a></div>
          <div><h4>Motoristas</h4><button type="button" onClick={() => formularios.abrir("motorista")}>Pré-cadastro</button><a href={linkSecao("beneficios")}>Benefícios</a><a href={linkSecao("cidades")}>Cidades atendidas</a></div>
          <div><h4>Empresas</h4><button type="button" onClick={() => formularios.abrir("empresa")}>Soluções Corporativas</button><a href={linkSecao("beneficios")}>Benefícios e Parceiros</a><button type="button" onClick={() => formularios.abrir("contato")}>Contato comercial</button></div>
          <div><h4>Ajuda</h4><button type="button" onClick={() => abrir()}>Central de Atendimento</button><a href={linkSecao("ajuda")}>FAQ</a><a href={linkSecao("seguranca")}>Segurança</a></div>
          <div>
            <h4>Institucional</h4>
            {paginas.map((p) => <Link key={p.id} href={`/paginas/${p.slug}`}>{p.titulo}</Link>)}
            <button type="button" onClick={() => formularios.abrir("contato")}>Contato</button>
          </div>
        </div>
        <div className="footer-fim">
          <Lojas escuro />
          <div className="copy">
            <span>© {new Date().getFullYear()} {c.copyright}. Todos os direitos reservados.</span>
            {cidade && <span>📍 {cidade.nome}{cidade.uf ? ` - ${cidade.uf}` : ""}</span>}
            {pagina("termos-de-uso", "Termos de Uso")}
            {pagina("politica-de-privacidade", "Política de Privacidade")}
          </div>
        </div>
      </div>
    </footer>
  );
}
