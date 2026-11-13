// /admin do site ViaMob360: marca, menu, perfis e cadastros (o resto vem do kit do monorepo — scripts/copiar-admin-site.py).
// As MESMAS coleções e permissões (menu.site.*) do admsite360 e do grupo "Site público" do painel ViaMob360: o conteúdo pode
// ser editado aqui, lá ou no admsite360. Campos = os que o site lê (lib/data.ts); o que não está no formulário é preservado.
import { BookOpen, Gauge, HelpCircle, Inbox, Megaphone, Settings, UserCog, Users } from "lucide-react";
import { cadastrosNucleo, PERMISSAO_GRUPOS, PERMISSAO_PAINEL, PERMISSAO_USUARIOS } from "./nucleo";
import type { Cadastro, Campo, Opcao, SiteAdmin } from "./tipos";

const P = {
  configuracao: "menu.site.configuracao", paginas: "menu.site.paginas", faq: "menu.site.faq", avisos: "menu.site.avisos", leads: "menu.site.leads",
};
const PERMISSOES: Record<string, string> = {
  [PERMISSAO_PAINEL]: "Painel", [P.configuracao]: "Configuração do site", [P.paginas]: "Páginas", [P.faq]: "Perguntas frequentes",
  [P.avisos]: "Avisos", [P.leads]: "Interessados", [PERMISSAO_USUARIOS]: "Usuários", [PERMISSAO_GRUPOS]: "Grupos de permissões",
};
const CONTEUDO = [PERMISSAO_PAINEL, P.paginas, P.faq, P.avisos];
const PERFIS: Opcao[] = [
  { valor: "administrador", rotulo: "Administrador (tudo)" }, { valor: "editor", rotulo: "Editor de conteúdo" },
  { valor: "comercial", rotulo: "Comercial (interessados)" }, { valor: "atendimento", rotulo: "Atendimento (chat)" }, { valor: "auditoria", rotulo: "Auditoria" },
];

const op = (lista: readonly string[], rotulos?: Record<string, string>): Opcao[] => lista.map((v) => ({ valor: v, rotulo: rotulos?.[v] ?? v }));
const STATUS_PUB = op(["publicada", "rascunho"], { publicada: "Publicada", rascunho: "Rascunho" });
const STATUS_CAD = op(["ativo", "inativo"], { ativo: "Ativo", inativo: "Inativo" });
const status = (opcoes: Opcao[], padrao: string): Campo => ({ nome: "status", rotulo: "Status", tipo: "select", obrigatorio: true, padrao, opcoes });
const ORDEM: Campo = { nome: "ordem", rotulo: "Ordem", tipo: "numero", padrao: 0 };
const porOrdem = (a: any, b: any) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0);
const slugOk = async (d: Record<string, any>) => (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug || "") ? d : "Endereço (slug): use só letras minúsculas, números e hífen.");
const indicadores: Campo[] = [1, 2, 3, 4].flatMap((n) => [
  { nome: `indicador${n}_valor`, rotulo: `Indicador ${n} — valor`, tipo: "texto" } as Campo,
  { nome: `indicador${n}_texto`, rotulo: `Indicador ${n} — texto`, tipo: "texto", largura: 2 } as Campo,
]);

const CADASTROS: Cadastro[] = [
  {
    id: "configuracao", titulo: "Configuração do site", singular: "configuração", colecao: "configuracoes_site", permissao: P.configuracao, rotulo: "nome_site", unico: true,
    descricao: "Marca, cores, banner, indicadores, lojas do app, contatos, redes, SEO e o Chat com a Central.",
    campos: [
      { nome: "nome_site", rotulo: "Nome do site", tipo: "texto", obrigatorio: true, padrao: "ViaMob360", largura: 2 }, { nome: "slogan", rotulo: "Slogan", tipo: "texto" },
      status(STATUS_CAD, "ativo"),
      { nome: "tema_site", rotulo: "Tema do site", tipo: "select", padrao: "escuro", opcoes: op(["escuro", "claro", "automatico"], { escuro: "Escuro", claro: "Claro", automatico: "Seguir o aparelho" }) },
      { nome: "tema_botao", rotulo: "Mostrar botão claro/escuro no topo", tipo: "check", padrao: true },
      { nome: "logo", rotulo: "Logo", tipo: "imagem" }, { nome: "logo_rodape", rotulo: "Logo do rodapé", tipo: "imagem" }, { nome: "favicon", rotulo: "Ícone da aba (favicon)", tipo: "imagem" },
      { nome: "cor_primaria", rotulo: "Cor primária", tipo: "cor" }, { nome: "cor_destaque", rotulo: "Cor de destaque", tipo: "cor" }, { nome: "cor_texto_escuro", rotulo: "Cor do texto no tema escuro", tipo: "cor" },
      { nome: "hero_chamada", rotulo: "Banner — chamada", tipo: "texto", largura: 2 }, { nome: "hero_imagem", rotulo: "Banner — imagem", tipo: "imagem" },
      { nome: "hero_titulo", rotulo: "Banner — título", tipo: "texto", largura: 2 }, { nome: "hero_titulo_destaque", rotulo: "Banner — título (destaque)", tipo: "texto" },
      { nome: "hero_texto", rotulo: "Banner — texto", tipo: "textarea", largura: 3 },
      { nome: "cta_passageiro_texto", rotulo: "Botão do passageiro", tipo: "texto" }, { nome: "cta_motorista_texto", rotulo: "Botão do motorista", tipo: "texto" },
      { nome: "chips", rotulo: "Selos do banner (um por linha)", tipo: "linhas", largura: 3 },
      ...indicadores,
      { nome: "motorista_ganhos_hoje", rotulo: "Exemplo do app do motorista — ganhos hoje", tipo: "texto" }, { nome: "motorista_corridas", rotulo: "— corridas", tipo: "texto" },
      { nome: "motorista_horas_online", rotulo: "— horas online", tipo: "texto" }, { nome: "motorista_repasse", rotulo: "— repasse", tipo: "texto" },
      { nome: "google_play_url", rotulo: "Link do app no Google Play", tipo: "texto", largura: 2 }, { nome: "app_store_url", rotulo: "Link do app na App Store", tipo: "texto" },
      { nome: "email_contato", rotulo: "E-mail de contato", tipo: "email" }, { nome: "telefone_contato", rotulo: "Telefone", tipo: "texto" }, { nome: "endereco", rotulo: "Endereço", tipo: "texto" },
      { nome: "instagram_url", rotulo: "Instagram", tipo: "texto" }, { nome: "facebook_url", rotulo: "Facebook", tipo: "texto" },
      { nome: "linkedin_url", rotulo: "LinkedIn", tipo: "texto" }, { nome: "youtube_url", rotulo: "YouTube", tipo: "texto" },
      { nome: "texto_rodape", rotulo: "Texto do rodapé", tipo: "textarea", largura: 2 }, { nome: "copyright", rotulo: "Copyright", tipo: "texto" },
      { nome: "seo_titulo", rotulo: "Título para o Google (até 70)", tipo: "texto", largura: 2 }, { nome: "seo_descricao", rotulo: "Descrição para o Google (até 160)", tipo: "textarea", largura: 3 },
      { nome: "chat_titulo", rotulo: "Título do chat", tipo: "texto" }, { nome: "chat_pergunta_nome", rotulo: "Pergunta do nome no chat", tipo: "texto", largura: 2 },
      { nome: "chat_saudacao", rotulo: "Saudação do chat", tipo: "textarea", largura: 3 },
      { nome: "chat_assuntos", rotulo: "Assuntos do chat (um por linha)", tipo: "linhas", largura: 3 },
    ],
    colunas: [{ campo: "nome_site", rotulo: "Site" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
  {
    id: "paginas", titulo: "Páginas", singular: "página", colecao: "paginas_site", permissao: P.paginas, rotulo: "titulo", ordenar: porOrdem, preparar: slugOk,
    descricao: "Páginas institucionais (termos de uso, privacidade, sobre...) — endereço /paginas/<slug>.",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "slug", rotulo: "Endereço (slug)", tipo: "texto", obrigatorio: true, dica: "Só letras minúsculas, números e hífen." },
      status(STATUS_PUB, "rascunho"),
      { nome: "local", rotulo: "Onde aparece o link", tipo: "select", padrao: "rodape", opcoes: op(["rodape", "menu", "nenhum"], { rodape: "Rodapé", menu: "Menu", nenhum: "Só pelo endereço" }) }, ORDEM,
      { nome: "resumo", rotulo: "Resumo", tipo: "texto", largura: 2 }, { nome: "imagem", rotulo: "Imagem", tipo: "imagem" },
      { nome: "seo_descricao", rotulo: "Descrição para o Google (até 160)", tipo: "texto", largura: 3 },
      { nome: "conteudo", rotulo: "Conteúdo da página", tipo: "markdown", obrigatorio: true },
    ],
    colunas: [{ campo: "titulo", rotulo: "Título" }, { campo: "slug", rotulo: "Endereço" }, { campo: "local", rotulo: "Link", tipo: "opcao" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
  {
    id: "faq", titulo: "Perguntas frequentes", singular: "pergunta", colecao: "perguntas_frequentes", permissao: P.faq, rotulo: "pergunta", ordenar: porOrdem,
    campos: [
      { nome: "pergunta", rotulo: "Pergunta", tipo: "texto", obrigatorio: true, largura: 2 }, status(STATUS_PUB, "publicada"),
      { nome: "resposta", rotulo: "Resposta", tipo: "markdown", obrigatorio: true },
      { nome: "publico", rotulo: "Público", tipo: "select", padrao: "geral", opcoes: op(["geral", "passageiro", "motorista", "empresa"], { geral: "Geral", passageiro: "Passageiro", motorista: "Motorista", empresa: "Empresa" }) },
      { nome: "destaque_home", rotulo: "Mostrar na página inicial", tipo: "check" }, ORDEM,
    ],
    colunas: [{ campo: "pergunta", rotulo: "Pergunta" }, { campo: "publico", rotulo: "Público", tipo: "opcao" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
  {
    id: "avisos", titulo: "Avisos", singular: "aviso", colecao: "avisos_site", permissao: P.avisos, rotulo: "titulo", ordenar: porOrdem,
    descricao: "Faixa no topo ou janela (pop-up) com período no ar.",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "tipo", rotulo: "Como aparece", tipo: "select", padrao: "faixa", opcoes: op(["faixa", "modal"], { faixa: "Faixa no topo", modal: "Janela (pop-up)" }) },
      status(STATUS_CAD, "ativo"), { nome: "inicio_em", rotulo: "No ar a partir de", tipo: "datahora" }, { nome: "fim_em", rotulo: "Sai do ar em", tipo: "datahora" }, ORDEM,
      { nome: "mensagem", rotulo: "Mensagem", tipo: "markdown" },
      { nome: "imagem", rotulo: "Imagem (só na janela)", tipo: "imagem" }, { nome: "link_texto", rotulo: "Botão (texto)", tipo: "texto" }, { nome: "link_url", rotulo: "Botão (link)", tipo: "texto" },
    ],
    colunas: [{ campo: "titulo", rotulo: "Título" }, { campo: "tipo", rotulo: "Como", tipo: "opcao" }, { campo: "inicio_em", rotulo: "Início", tipo: "datahora" }, { campo: "fim_em", rotulo: "Fim", tipo: "datahora" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
  {
    id: "interessados", titulo: "Interessados", singular: "interessado", colecao: "leads_site", permissao: P.leads, rotulo: "nome", semNovo: true,
    ordenar: (a, b) => Number(b.id || 0) - Number(a.id || 0),
    descricao: "Pré-cadastro de motorista parceiro, empresas e contato pelo site.",
    campos: [
      { nome: "tipo", rotulo: "Tipo", tipo: "select", opcoes: op(["motorista", "empresa", "contato", "imprensa"], { motorista: "Motorista parceiro", empresa: "Empresa", contato: "Contato", imprensa: "Imprensa" }) },
      { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true },
      { nome: "status", rotulo: "Status", tipo: "select", padrao: "novo", opcoes: op(["novo", "em_contato", "concluido", "descartado"], { novo: "Novo", em_contato: "Em contato", concluido: "Concluído", descartado: "Descartado" }) },
      { nome: "email", rotulo: "E-mail", tipo: "email" }, { nome: "telefone", rotulo: "Telefone / WhatsApp", tipo: "texto" }, { nome: "contatado_em", rotulo: "Contatado em", tipo: "datahora" },
      { nome: "cidade", rotulo: "Cidade", tipo: "texto" }, { nome: "uf", rotulo: "UF", tipo: "texto" }, { nome: "veiculo", rotulo: "Veículo (motorista)", tipo: "texto" },
      { nome: "razao_social", rotulo: "Razão social (empresa)", tipo: "texto" }, { nome: "cnpj", rotulo: "CNPJ", tipo: "texto" }, { nome: "colaboradores_estimados", rotulo: "Colaboradores", tipo: "numero" },
      { nome: "assunto", rotulo: "Assunto", tipo: "texto" }, { nome: "aceite_lgpd", rotulo: "Aceitou a Política de Privacidade (LGPD)", tipo: "check" },
      { nome: "mensagem", rotulo: "Mensagem do interessado", tipo: "textarea", largura: 3 }, { nome: "observacoes", rotulo: "Anotações internas", tipo: "textarea", largura: 3 },
    ],
    colunas: [{ campo: "nome", rotulo: "Nome" }, { campo: "tipo", rotulo: "Tipo", tipo: "opcao" }, { campo: "cidade", rotulo: "Cidade" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
];

export const SITE_ADMIN: SiteAdmin = {
  nome: "ViaMob360",
  logo: "/images/logo-viamob360.png",
  logoBranco: "/images/logo-viamob360-branco.png",
  chaveSessao: "admin-viamob360",
  modulo: "site",
  permissoes: PERMISSOES,
  perfis: { administrador: "*", editor: CONTEUDO, comercial: [PERMISSAO_PAINEL, P.leads], atendimento: [PERMISSAO_PAINEL], auditoria: [PERMISSAO_PAINEL, P.leads] },
  login: {
    frase: "Mobilidade que *aproxima*:\no seu site em *tempo real*.",
    destaques: [
      { icone: "🚗", cor: "#3B82F6", titulo: "Banner e indicadores", texto: "Edite a página inicial" },
      { icone: "📢", cor: "#FACC15", titulo: "Avisos", texto: "Faixa ou janela com período" },
      { icone: "🧑‍✈️", cor: "#22C55E", titulo: "Motoristas e empresas", texto: "Interessados do site" },
      { icone: "💬", cor: "#EC4899", titulo: "Chat com a Central", texto: "Saudação e assuntos" },
    ],
  },
  menu: [
    { grupo: "Visão geral", itens: [
      { href: "/admin", rotulo: "Painel", permissao: PERMISSAO_PAINEL, icone: <Gauge size={18} /> },
      { href: "/admin/interessados", rotulo: "Interessados", permissao: P.leads, icone: <Inbox size={18} /> },
    ] },
    { grupo: "Conteúdo", itens: [
      { href: "/admin/paginas", rotulo: "Páginas", permissao: P.paginas, icone: <BookOpen size={18} /> },
      { href: "/admin/faq", rotulo: "Perguntas frequentes", permissao: P.faq, icone: <HelpCircle size={18} /> },
      { href: "/admin/avisos", rotulo: "Avisos", permissao: P.avisos, icone: <Megaphone size={18} /> },
    ] },
    { grupo: "Configurações", itens: [
      { href: "/admin/configuracao", rotulo: "Configuração do site", permissao: P.configuracao, icone: <Settings size={18} /> },
      { href: "/admin/usuarios", rotulo: "Usuários", permissao: PERMISSAO_USUARIOS, icone: <Users size={18} /> },
      { href: "/admin/grupos", rotulo: "Grupos de permissões", permissao: PERMISSAO_GRUPOS, icone: <UserCog size={18} /> },
    ] },
  ],
  cadastros: [...CADASTROS, ...cadastrosNucleo(PERMISSOES, PERFIS)],
};
