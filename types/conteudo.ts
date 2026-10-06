// Formas que o site usa — espelham os schemas do painel ViaMob360
// (shared/shemas/viamob360/{ConfiguracaoSite,PaginaSite,AvisoSite,
// PerguntaFrequente}Shema.ts), já normalizadas por lib/data.ts.

export type Indicador = { valor: string; texto: string };

export type Configuracao = {
  nomeSite: string;
  slogan: string;
  logoUrl: string | null;
  logoRodapeUrl: string | null;
  faviconUrl: string | null;
  corPrimaria: string;
  corDestaque: string;
  heroChamada: string;
  heroTitulo: string;
  heroTituloDestaque: string;
  heroTexto: string;
  heroImagemUrl: string | null;
  ctaPassageiroTexto: string;
  ctaMotoristaTexto: string;
  chips: string[];
  indicadores: Indicador[];
  motorista: { ganhosHoje: string; corridas: string; horasOnline: string; repasse: string };
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
  email: string;
  telefone: string;
  endereco: string;
  redes: { rede: "instagram" | "facebook" | "linkedin" | "youtube"; url: string }[];
  textoRodape: string;
  copyright: string;
  seoTitulo: string;
  seoDescricao: string;
  chatTitulo: string;
  chatSaudacao: string;
  chatAssuntos: string[];
  chatPerguntaNome: string;
};

export type Pagina = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagemUrl: string | null;
  local: "rodape" | "menu" | "nenhum";
  ordem: number;
  seoDescricao: string;
};

export type Aviso = {
  id: string;
  versao: number;
  titulo: string;
  mensagem: string;
  imagemUrl: string | null;
  linkUrl: string;
  linkTexto: string;
  tipo: "faixa" | "modal";
  ordem: number;
};

export type Pergunta = {
  id: string;
  pergunta: string;
  resposta: string;
  publico: string;
  destaqueHome: boolean;
  ordem: number;
};

export type Cidade = { path: string; nome: string; uf: string };
