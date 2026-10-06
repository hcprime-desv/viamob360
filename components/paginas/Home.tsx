"use client";

// Home do site ViaMob360 — layout de documentacao/site_principal.png com as
// seções e textos do wireframe (ViaMob360_Wireframe_Site.html). Sem área de
// prefeitura (decisão do dono, 06/10/2026: tudo da prefeitura é no painel);
// no lugar do bloco "Para prefeituras" fica o do motorista parceiro, ao lado
// do Chat com a Central. Conteúdo editável no painel → Site público.
import { useEffect, useState } from "react";
import {
  ArrowRight, Building2, Car, CarFront, ChevronRight, CircleHelp, Clock, Gift, HeartHandshake, Landmark, Leaf,
  MapPin, MessageCircleMore, ShieldCheck, Smartphone, Sparkles, UserRound, Users, Wallet,
} from "lucide-react";
import { useCidades, useConfiguracao, usePerguntas } from "@/components/public/AoVivo";
import { ChatPainel, useChat } from "@/components/chat/ChatCentral";
import { useFormularios } from "@/components/forms/Formularios";
import { Lojas } from "@/components/public/Footer";
import { getAllOnce } from "@/lib/firebase/gen";
import { linkSecao } from "@/lib/util";

const ICONES_CHIPS = [Users, Leaf, Sparkles, ShieldCheck];
const ICONES_INDICADORES = [CarFront, Users, UserRound, Landmark];
// Texto do botão em duas linhas: as duas primeiras palavras em destaque.
const duasLinhas = (t: string) => { const p = t.replace(/^\p{Extended_Pictographic}\s*/u, "").split(/\s+/); return [p.slice(0, 2).join(" "), p.slice(2).join(" ")]; };
// Junta as 3 últimas palavras com espaço não separável quando a 1ª é curta
// ("e cidades.") — a quebra fica "aproxima pessoas / e cidades.".
const juntarFinal = (t: string) => { const p = t.trim().split(/\s+/); if (p.length < 3) return t; const n = p.length; return p[n - 2].length <= 2 ? [...p.slice(0, n - 2), `${p[n - 2]} ${p[n - 1]}`].join(" ") : t; };
const CATEGORIAS_BASE = ["ViaMob Econômico", "ViaMob Conforto", "ViaMob Mulher", "ViaMob Táxi", "ViaMob Acessível", "ViaMob Pet", "ViaMob Executivo", "Agendado"];

function SeletorCidade() {
  const { cidades, cidade, escolherCidade } = useCidades();
  if (!cidade) return null;
  return (
    <label className="pill-cidade">
      <MapPin size={18} aria-hidden />
      {cidades.length > 1 ? (
        <select value={cidade.path} onChange={(e) => escolherCidade(e.target.value)} aria-label="Escolha a sua cidade">
          {cidades.map((c) => <option key={c.path} value={c.path}>{c.nome}{c.uf ? ` - ${c.uf}` : ""}</option>)}
        </select>
      ) : (
        <b>{cidade.nome}{cidade.uf ? ` - ${cidade.uf}` : ""}</b>
      )}
    </label>
  );
}

// Categorias ativas do município escolhido (tarifas e zonas do painel).
function useCategorias() {
  const { cidade } = useCidades();
  const [nomes, setNomes] = useState<string[]>(CATEGORIAS_BASE);
  useEffect(() => {
    if (!cidade) return;
    let vivo = true;
    getAllOnce("categorias_servico", cidade.path)
      .then((docs) => {
        const ativas = docs.filter((d) => d.status === "ativo" && d.nome).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map((d) => String(d.nome));
        if (vivo && ativas.length) setNomes(ativas);
      })
      .catch(() => { /* mantém a lista padrão */ });
    return () => { vivo = false; };
  }, [cidade]);
  return nomes;
}

export default function Home() {
  const c = useConfiguracao();
  const perguntas = usePerguntas();
  const { cidades, cidade, escolherCidade } = useCidades();
  const { abrir } = useChat();
  const formularios = useFormularios();
  const categorias = useCategorias();
  const [busca, setBusca] = useState("");
  const app = c.googlePlayUrl || c.appStoreUrl || linkSecao("baixar");
  const banner = c.heroImagemUrl || "/images/banner-cidade-app.jpg";

  const faq = (busca.trim()
    ? perguntas.filter((p) => `${p.pergunta} ${p.resposta}`.toLowerCase().includes(busca.trim().toLowerCase()))
    : perguntas.filter((p) => p.destaqueHome));

  const cards = [
    { icone: UserRound, cor: "azul", titulo: "Para Passageiros", texto: "Viagens práticas, seguras e com mais oportunidades na sua cidade.", acao: () => (location.hash = "passageiros") },
    { icone: Car, cor: "verde", titulo: "Para Motoristas Parceiros", texto: "Mais ganhos, flexibilidade e apoio para o seu dia a dia.", acao: () => (location.hash = "motoristas") },
    { icone: MapPin, cor: "roxo", titulo: "Cidades atendidas", texto: "Uma plataforma multi-cidade, com regras e categorias de cada município.", acao: () => (location.hash = "cidades") },
    { icone: Building2, cor: "azul", titulo: "Empresas", texto: "Soluções corporativas de mobilidade para equipes e colaboradores.", acao: () => (location.hash = "empresas") },
    { icone: ShieldCheck, cor: "verde", titulo: "Segurança", texto: "Tecnologia e monitoramento para uma viagem mais segura para todos.", acao: () => (location.hash = "seguranca") },
    { icone: HeartHandshake, cor: "laranja", titulo: "Benefícios e Parceiros", texto: "Descontos, combustível, vantagens e uma rede de parceiros que move você.", acao: () => (location.hash = "beneficios") },
    { icone: MessageCircleMore, cor: "vermelho", titulo: "Fale com a Central", texto: "Atendimento 24h para suporte, informações e emergências.", acao: () => abrir() },
    { icone: CircleHelp, cor: "cinza", titulo: "FAQ", texto: "Tire suas dúvidas sobre o app, corridas, cadastro e muito mais.", acao: () => (location.hash = "ajuda") },
  ];

  return (
    <>
      {/* ── Topo (hero) ─────────────────────────────────────────────── */}
      <section className="hero" id="inicio">
        <div className="hero-bg" style={{ ["--banner" as any]: `url('${banner}')`, ["--banner-mobile" as any]: `url('${c.heroImagemUrl || "/images/banner-cidade-app-mobile.jpg"}')` }} />
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">{c.heroChamada}</div>
            <h1>{c.heroTitulo} {c.heroTituloDestaque && <span className="g">{juntarFinal(c.heroTituloDestaque)}</span>}</h1>
            <p>{c.heroTexto}</p>
            <div className="hero-actions">
              <a className="btn btn-primary btn-grande" href={app}>
                <Smartphone size={30} aria-hidden /><span><b>{duasLinhas(c.ctaPassageiroTexto)[0]}</b><small>{duasLinhas(c.ctaPassageiroTexto)[1]}</small></span><ChevronRight size={20} aria-hidden />
              </a>
              <button type="button" className="btn btn-outline-green btn-grande" onClick={() => formularios.abrir("motorista")}>
                <Car size={30} aria-hidden /><span><b>{duasLinhas(c.ctaMotoristaTexto)[0]}</b><small>{duasLinhas(c.ctaMotoristaTexto)[1]}</small></span><ChevronRight size={20} aria-hidden />
              </button>
            </div>
            {c.chips.length > 0 && (
              <div className="chips">
                {c.chips.slice(0, 4).map((t, i) => { const I = ICONES_CHIPS[i % ICONES_CHIPS.length]; return <span className="chip" key={t}><span className="chip-ic"><I size={18} /></span>{t}</span>; })}
              </div>
            )}
          </div>
          {cidade && (
            <div className="hero-cidade" aria-hidden>
              <b>{cidade.nome}</b> em movimento por uma cidade melhor.
            </div>
          )}
          {c.indicadores.length > 0 && (
            <div className="hero-numeros">
              {c.indicadores.map((n, i) => { const I = ICONES_INDICADORES[i % ICONES_INDICADORES.length]; return (
                <div className="numero" key={i}><span className="numero-ic"><I size={22} /></span><div><strong>{n.valor}</strong><span>{n.texto}</span></div></div>
              ); })}
            </div>
          )}
          <SeletorCidade />
        </div>
      </section>

      {/* ── Cartões por público (8) ───────────────────────────────────── */}
      <section className="container faixa-cards">
        <div className="cards8">
          {cards.map((k) => (
            <button type="button" key={k.titulo} className={`card8 ${k.cor === "vermelho" ? "destaque" : ""}`} onClick={k.acao}>
              <span className={`icon-circ ${k.cor}`}><k.icone size={24} /></span>
              <h3>{k.titulo}</h3>
              <p>{k.texto}</p>
              <span className="saiba">Saiba mais <ArrowRight size={15} /></span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Motorista parceiro + cartão de ganhos + Chat com a Central ── */}
      <section className="container faixa-tripla" id="motoristas">
        <div className="tripla-card">
        <div className="bloco-texto">
          <span className="tag">Para motoristas parceiros</span>
          <h2>Seu trabalho, com ganhos transparentes.</h2>
          <p>Taxa reduzida, valor da corrida e repasse sempre claros, flexibilidade para ficar online quando quiser e benefícios de parceiros.</p>
          <div className="checks">
            {["Pré-cadastro, análise e ativação pelo app.", "Ofertas com valor e distância antes de aceitar.", "Repasse via Pix e extrato da carteira.", "Suporte dedicado na Central 24h."].map((t) => (
              <div className="check" key={t}><span className="dot">✓</span><span>{t}</span></div>
            ))}
          </div>
          <button type="button" className="btn btn-green" onClick={() => formularios.abrir("motorista")}>Quero ser parceiro <ArrowRight size={18} /></button>
        </div>
        <div className="painel-motorista" aria-label="Exemplo do app do motorista">
          <div className="pm-lado">
            <div className="pm-marca">ViaMob360<small>App do Motorista</small></div>
            {["Início", "Ofertas", "Ganhos", "Carteira", "Benefícios", "Ajuda"].map((t, i) => <span key={t} className={i === 2 ? "ativo" : undefined}>{t}</span>)}
          </div>
          <div className="pm-conteudo">
            <div className="pm-topo"><b>Ganhos de hoje</b><span className="pm-online">● Você está online</span></div>
            <div className="pm-metricas">
              <div><Wallet size={18} /><small>Ganhos hoje</small><b>{c.motorista.ganhosHoje}</b></div>
              <div><CarFront size={18} /><small>Corridas</small><b>{c.motorista.corridas}</b></div>
              <div><Clock size={18} /><small>Horas online</small><b>{c.motorista.horasOnline}</b></div>
              <div><Gift size={18} /><small>Repasse</small><b>{c.motorista.repasse}</b></div>
            </div>
            <div className="pm-grafico">
              <small>Ganhos na semana</small>
              <svg viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden>
                <polyline points="0,80 40,70 80,74 120,52 160,58 200,36 240,40 300,14" fill="none" stroke="var(--green)" strokeWidth="3" />
                <polyline points="0,80 40,70 80,74 120,52 160,58 200,36 240,40 300,14 300,90 0,90" fill="rgba(7,169,88,.12)" stroke="none" />
              </svg>
            </div>
            <div className="pm-mapa"><small>Mapa de oportunidades</small><span>{cidade?.nome ?? "Sua cidade"}</span></div>
          </div>
        </div>
        </div>
        <ChatPainel />
      </section>

      {/* ── Como funciona (wireframe) ─────────────────────────────────── */}
      <section className="section soft" id="como-funciona">
        <div className="container">
          <div className="section-head">
            <div><div className="eyebrow">Jornada do passageiro</div><h2>Como funciona.</h2></div>
            <p>Fluxo simples, previsível e totalmente orientado à confiança e transparência.</p>
          </div>
          <div className="flow">
            <div className="step"><strong>Informe o destino</strong><p>Use sua localização atual e escolha para onde deseja ir.</p></div>
            <div className="step"><strong>Compare opções</strong><p>Veja categoria, tempo de chegada, estimativa e recursos de acessibilidade.</p></div>
            <div className="step"><strong>Acompanhe a corrida</strong><p>Motorista, veículo, mapa, PIN de segurança e compartilhamento de rota.</p></div>
            <div className="step"><strong>Avalie e receba comprovante</strong><p>Finalize, pague, avalie e mantenha o histórico disponível no app.</p></div>
          </div>
        </div>
      </section>

      {/* ── Passageiros: categorias do município ───────────────────────── */}
      <section className="section" id="passageiros">
        <div className="container two-col">
          <div>
            <div className="eyebrow">Para passageiros</div>
            <h2 className="h2-grande">Preço claro, segurança e mobilidade acessível.</h2>
            <p className="texto-mut">Veja a estimativa antes de pedir, escolha a categoria e pague como preferir: Pix, cartão, carteira digital, créditos corporativos ou vouchers.</p>
            <div className="checks">
              {["Estimativa de preço e tempo de chegada.", "Tarifa com teto definido pelo município.", "PIN de embarque e compartilhamento de rota.", "Histórico e comprovantes no app."].map((t) => (
                <div className="check" key={t}><span className="dot">✓</span><span>{t}</span></div>
              ))}
            </div>
            <a className="btn btn-primary" href={app}>Quero viajar <ArrowRight size={18} /></a>
          </div>
          <div className="panel">
            <div className="panel-head"><b>Categorias{cidade ? ` em ${cidade.nome}` : ""}</b><div className="panel-sub">Disponibilidade e regras variam conforme o município</div></div>
            <div className="panel-body categorias">
              {categorias.map((n) => <span key={n} className="categoria"><CarFront size={18} />{n}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Segurança (wireframe) ─────────────────────────────────────── */}
      <section className="section safety" id="seguranca">
        <div className="container">
          <div className="section-head">
            <div><div className="eyebrow claro">Segurança</div><h2>Proteção antes, durante e depois da viagem.</h2></div>
            <p>Recursos para reduzir riscos e dar suporte rápido a passageiros e motoristas.</p>
          </div>
          <div className="safety-grid">
            <div className="safety-card"><h3>PIN de embarque</h3><p>Confirmação segura antes do início da corrida.</p></div>
            <div className="safety-card"><h3>Compartilhar rota</h3><p>Envio do percurso e dados da viagem para contato de confiança.</p></div>
            <div className="safety-card"><h3>Central 24h</h3><p>Atendimento humano para suporte, incidentes, objetos perdidos e emergências.</p></div>
            <div className="safety-card"><h3>SOS</h3><p>Atalho prioritário para eventos críticos e protocolo de segurança.</p></div>
          </div>
        </div>
      </section>

      {/* ── Empresas + Benefícios ─────────────────────────────────────── */}
      <section className="section" id="empresas">
        <div className="container two-col alinhado-topo">
          <div className="card grande">
            <span className="icon-circ azul"><Building2 size={24} /></span>
            <h3>ViaMob Empresas</h3>
            <p>Conta corporativa, centros de custo, regras de uso, colaboradores, relatórios e faturamento consolidado.</p>
            <div className="checks">
              {["Limite de valor por viagem, horários e destinos permitidos.", "Projetos, unidades e departamentos.", "Aprovação de viagens quando necessário.", "Relatórios consolidados e faturamento."].map((t) => (
                <div className="check" key={t}><span className="dot">✓</span><span>{t}</span></div>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={() => formularios.abrir("empresa")}>Quero a conta corporativa</button>
          </div>
          <div className="card grande" id="beneficios">
            <span className="icon-circ laranja"><HeartHandshake size={24} /></span>
            <h3>Benefícios e Parceiros</h3>
            <p>Uma rede de parceiros para o motorista ir mais longe — e o ViaMob Pontos, o programa de fidelidade do parceiro.</p>
            <div className="beneficios">
              {["Combustível", "Oficina", "Pneus", "Seguro", "Alimentação", "ViaMob Pontos"].map((b) => <span key={b} className="beneficio">{b}</span>)}
            </div>
            <button type="button" className="btn btn-outline" onClick={() => formularios.abrir("contato")}>Quero ser um parceiro de benefícios</button>
          </div>
        </div>
      </section>

      {/* ── Cidades atendidas ─────────────────────────────────────────── */}
      <section className="section soft" id="cidades">
        <div className="container">
          <div className="section-head">
            <div><div className="eyebrow">Multi-cidade</div><h2>Cidades atendidas.</h2></div>
            <p>Uma plataforma para diferentes municípios. Categorias, tarifas e regras seguem cada cidade.</p>
          </div>
          <div className="cidades">
            {cidades.map((x) => (
              <button type="button" key={x.path} className={`cidade${cidade?.path === x.path ? " ativa" : ""}`} onClick={() => escolherCidade(x.path)}>
                <MapPin size={18} /> {x.nome}{x.uf ? ` - ${x.uf}` : ""}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Perguntas frequentes ──────────────────────────────────────── */}
      <section className="section" id="ajuda">
        <div className="container">
          <div className="section-head">
            <div><div className="eyebrow">Ajuda</div><h2>Perguntas frequentes.</h2></div>
            <p>Conteúdo para orientar passageiros e parceiros antes de acionar a Central.</p>
          </div>
          <label className="busca-faq">
            <span className="sr">Buscar nas perguntas</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por palavra-chave (ex.: pagamento, cadastro, segurança)" />
          </label>
          <div className="faq">
            {faq.map((p, i) => (
              <details key={p.id} open={i === 0 && !busca}><summary>{p.pergunta}</summary><p>{p.resposta}</p></details>
            ))}
          </div>
          {faq.length === 0 && (
            <div className="notice">Não achamos nada com “{busca}”. <button type="button" className="link" onClick={() => abrir()}>Ainda precisa de ajuda? Fale com a Central.</button></div>
          )}
        </div>
      </section>

      {/* ── Chamada final + lojas ─────────────────────────────────────── */}
      <section className="section" id="baixar">
        <div className="container">
          <div className="cta">
            <div>
              <div className="eyebrow">{c.nomeSite}</div>
              <h2>Uma nova infraestrutura digital para a mobilidade da cidade.</h2>
              <p>Passageiro, motorista parceiro e empresa conectados em uma única estratégia de mobilidade urbana.</p>
              <Lojas />
            </div>
            <div className="cta-acoes">
              <a className="btn btn-primary" href={app}>Baixar o App</a>
              <button type="button" className="btn btn-outline" onClick={() => abrir()}>Fale com a Central</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
