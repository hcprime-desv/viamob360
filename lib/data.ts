// Leitura pública do site ViaMob360 — o que o painel (módulo Site) grava em
// dados/{tenant}/<colecao>. Só conteúdo público: configuracoes_site,
// paginas_site, avisos_site, perguntas_frequentes e o cadastro dos
// municípios. NUNCA ler passageiros, motoristas, corridas ou dados pessoais.
//
// Tempo real (padrão portal181/PetHub):
// - `listarX` / `buscarX` — leitura pontual no servidor Node a cada acesso
//   (force-dynamic): o HTML já sai com o dado atual (SEO);
// - `subscribeX` — listener no navegador: editou no painel, muda na tela.
//
// Regras de publicação (espelham o painel): página "publicada"; pergunta
// "publicada"; aviso no ar (avisoNoAr — lib/compartilhado/site.ts, a mesma
// função do painel); configuração com status "ativo". Sem configuração: os
// padrões do wireframe (iguais aos defaults do ConfiguracaoSiteShema).
import { getAll, getAllOnce, listarClientesViaMob, TENANT_PATH } from "@/lib/firebase/gen";
import { avisoNoAr } from "@/lib/compartilhado/site";
import type { Unsubscribe } from "firebase/firestore";
import type { Aviso, Cidade, Configuracao, Pagina, Pergunta } from "@/types/conteudo";

// Listener no cliente: se falhar (sem rede, regra), mantém o que já está na tela.
function subscrever<T>(colecao: string, mapear: (docs: any[]) => T, callback: (dados: T) => void): Unsubscribe {
  try {
    return getAll(colecao, (docs) => callback(mapear(docs)));
  } catch (e) {
    console.error(`[viamob360] listener de ${colecao} indisponível`, e);
    return () => {};
  }
}

const ms = (v: any): number | null => {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate().getTime();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};
const txt = (v: any, padrao = "") => (typeof v === "string" && v.trim() ? v : padrao);
const url = (v: any) => (typeof v === "string" && v.trim() ? v : null);
const num = (v: any, padrao = 0) => (typeof v === "number" && Number.isFinite(v) ? v : padrao);
const lista = (v: any, padrao: string[]) => (Array.isArray(v) && v.some((x) => typeof x === "string" && x.trim()) ? v.filter((x) => typeof x === "string" && x.trim()) : padrao);
const HEX = /^#[0-9A-Fa-f]{6}$/;
const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem;

// ── Configuração do site (registro único) ───────────────────────────────
export const CONFIGURACAO_BASE: Configuracao = {
  nomeSite: "ViaMob360", slogan: "Mobilidade que aproxima", logoUrl: null, logoRodapeUrl: null, faviconUrl: null,
  corPrimaria: "#075fd7", corDestaque: "#07a958",
  heroChamada: "Plataforma de mobilidade urbana", heroTitulo: "Mobilidade que", heroTituloDestaque: "aproxima pessoas e cidades.",
  heroTexto: "A ViaMob360 conecta passageiros, motoristas parceiros, empresas e prefeituras em um ecossistema de mobilidade mais seguro, justo, inteligente e eficiente.",
  heroImagemUrl: null, ctaPassageiroTexto: "Baixar App para Passageiros", ctaMotoristaTexto: "Seja Motorista Parceiro",
  chips: ["Mais mobilidade para todos", "Cidades mais sustentáveis", "Tecnologia a serviço da cidade", "Transporte mais seguro"],
  indicadores: [
    { valor: "24h", texto: "Central de atendimento e segurança" },
    { valor: "+ renda", texto: "Modelo pensado para o motorista parceiro" },
    { valor: "PIN + SOS", texto: "Segurança antes, durante e depois da viagem" },
    { valor: "Multi-cidade", texto: "Uma plataforma para diferentes municípios" },
  ],
  motorista: { ganhosHoje: "R$ 132,40", corridas: "8", horasOnline: "4h20min", repasse: "D+1" },
  appStoreUrl: null, googlePlayUrl: null, email: "", telefone: "", endereco: "", redes: [],
  textoRodape: "Mobilidade que aproxima pessoas, oportunidades e cidades.", copyright: "ViaMob360 • P2P Corp",
  seoTitulo: "ViaMob360 | Mobilidade que aproxima",
  seoDescricao: "Mobilidade urbana inteligente para passageiros, motoristas parceiros, empresas e prefeituras.",
  chatTitulo: "Chat com a Central", chatSaudacao: "Olá! 👋 Sou a Central ViaMob360. Como podemos ajudar?",
  chatAssuntos: ["Informações sobre uma corrida", "Segurança / emergência", "Cadastro de motorista parceiro", "Pagamentos e carteira", "Objetos perdidos", "Outros assuntos"],
  chatPerguntaNome: "Para iniciar o atendimento, qual é o seu nome?",
};

function mapearConfiguracao(docs: any[]): Configuracao {
  const d = docs.find((x) => x.status === "ativo") ?? null;
  const p = CONFIGURACAO_BASE;
  if (!d) return p;
  const indicadores = [1, 2, 3, 4]
    .map((n) => ({ valor: txt(d[`indicador${n}_valor`]), texto: txt(d[`indicador${n}_texto`]) }))
    .filter((i) => i.valor);
  const redes = (["instagram", "facebook", "linkedin", "youtube"] as const)
    .map((rede) => ({ rede, url: url(d[`${rede}_url`]) }))
    .filter((r): r is { rede: typeof r.rede; url: string } => !!r.url);
  return {
    nomeSite: txt(d.nome_site, p.nomeSite), slogan: txt(d.slogan, p.slogan),
    logoUrl: url(d.logo), logoRodapeUrl: url(d.logo_rodape), faviconUrl: url(d.favicon),
    corPrimaria: HEX.test(d.cor_primaria) ? d.cor_primaria : p.corPrimaria,
    corDestaque: HEX.test(d.cor_destaque) ? d.cor_destaque : p.corDestaque,
    heroChamada: txt(d.hero_chamada, p.heroChamada), heroTitulo: txt(d.hero_titulo, p.heroTitulo),
    heroTituloDestaque: txt(d.hero_titulo_destaque), heroTexto: txt(d.hero_texto, p.heroTexto), heroImagemUrl: url(d.hero_imagem),
    ctaPassageiroTexto: txt(d.cta_passageiro_texto, p.ctaPassageiroTexto), ctaMotoristaTexto: txt(d.cta_motorista_texto, p.ctaMotoristaTexto),
    chips: lista(d.chips, []), indicadores,
    motorista: {
      ganhosHoje: txt(d.motorista_ganhos_hoje, p.motorista.ganhosHoje), corridas: txt(d.motorista_corridas, p.motorista.corridas),
      horasOnline: txt(d.motorista_horas_online, p.motorista.horasOnline), repasse: txt(d.motorista_repasse, p.motorista.repasse),
    },
    appStoreUrl: url(d.app_store_url), googlePlayUrl: url(d.google_play_url),
    email: txt(d.email_contato), telefone: txt(d.telefone_contato), endereco: txt(d.endereco), redes,
    textoRodape: txt(d.texto_rodape, p.textoRodape), copyright: txt(d.copyright, p.copyright),
    seoTitulo: txt(d.seo_titulo, p.seoTitulo), seoDescricao: txt(d.seo_descricao, p.seoDescricao),
    chatTitulo: txt(d.chat_titulo, p.chatTitulo), chatSaudacao: txt(d.chat_saudacao, p.chatSaudacao),
    chatAssuntos: lista(d.chat_assuntos, p.chatAssuntos), chatPerguntaNome: txt(d.chat_pergunta_nome, p.chatPerguntaNome),
  };
}
export const listarConfiguracao = async () => mapearConfiguracao(await getAllOnce("configuracoes_site"));
export const subscribeConfiguracao = (cb: (c: Configuracao) => void) => subscrever("configuracoes_site", mapearConfiguracao, cb);

// ── Páginas institucionais ───────────────────────────────────────────────
const mapearPagina = (d: any): Pagina => ({
  id: d.id, titulo: txt(d.titulo), slug: txt(d.slug), resumo: txt(d.resumo), conteudo: txt(d.conteudo),
  imagemUrl: url(d.imagem), local: d.local === "menu" || d.local === "nenhum" ? d.local : "rodape", ordem: num(d.ordem), seoDescricao: txt(d.seo_descricao),
});
const mapearPaginas = (docs: any[]) => docs.filter((d) => d.status === "publicada" && d.slug).map(mapearPagina).sort(porOrdem);
export const listarPaginasPublicadas = async () => mapearPaginas(await getAllOnce("paginas_site"));
export const subscribePaginasPublicadas = (cb: (p: Pagina[]) => void) => subscrever("paginas_site", mapearPaginas, cb);
export const buscarPaginaPorSlug = async (slug: string) => (await listarPaginasPublicadas()).find((p) => p.slug === slug) ?? null;
export const subscribePaginaPorSlug = (slug: string, cb: (p: Pagina | null) => void) =>
  subscrever("paginas_site", (docs) => mapearPaginas(docs).find((p) => p.slug === slug) ?? null, cb);

// ── Perguntas frequentes ─────────────────────────────────────────────────
const mapearPerguntas = (docs: any[]): Pergunta[] =>
  docs.filter((d) => d.status === "publicada" && d.pergunta)
    .map((d) => ({ id: d.id, pergunta: txt(d.pergunta), resposta: txt(d.resposta), publico: txt(d.publico, "geral"), destaqueHome: d.destaque_home === true, ordem: num(d.ordem) }))
    .sort(porOrdem);
export const listarPerguntas = async () => mapearPerguntas(await getAllOnce("perguntas_frequentes"));
export const subscribePerguntas = (cb: (p: Pergunta[]) => void) => subscrever("perguntas_frequentes", mapearPerguntas, cb);

// ── Avisos ───────────────────────────────────────────────────────────────
const mapearAvisos = (docs: any[]): Aviso[] => {
  const agora = Date.now();
  return docs.filter((d) => avisoNoAr(d, agora))
    .map((d) => ({
      id: d.id, versao: ms(d.updated_at) ?? ms(d.created_at) ?? 0, titulo: txt(d.titulo), mensagem: txt(d.mensagem),
      imagemUrl: url(d.imagem), linkUrl: txt(d.link_url), linkTexto: txt(d.link_texto), tipo: d.tipo === "modal" ? "modal" : "faixa", ordem: num(d.ordem),
    } as Aviso))
    .sort(porOrdem);
};
export const listarAvisosAtivos = async () => mapearAvisos(await getAllOnce("avisos_site"));
export const subscribeAvisosAtivos = (cb: (a: Aviso[]) => void) => subscrever("avisos_site", mapearAvisos, cb);

// ── Cidades (multi-município) ────────────────────────────────────────────
// Municípios VIAMOB360 da coleção raiz `cliente` + o cadastro de cada um
// (`municipios`: nome e UF). Se a raiz não puder ser lida (regras), fica só
// o município do próprio tenant do site.
async function municipioDoTenant(path: string): Promise<Cidade | null> {
  try {
    const m = (await getAllOnce("municipios", path)).find((x) => x.status !== "inativo");
    return m ? { path, nome: txt(m.nome, path), uf: txt(m.uf) } : null;
  } catch {
    return null;
  }
}
export async function listarCidades(): Promise<Cidade[]> {
  let paths: string[] = [];
  try {
    paths = (await listarClientesViaMob()).filter((c) => c.status !== "Desativado" && c.status !== "Bloqueado" && c.path).map((c) => String(c.path));
  } catch {
    paths = [];
  }
  if (TENANT_PATH && !paths.includes(TENANT_PATH)) paths.unshift(TENANT_PATH);
  const cidades = (await Promise.all(paths.map(municipioDoTenant))).filter((c): c is Cidade => !!c);
  return cidades.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
