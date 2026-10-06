// ═══ GERADO a partir do painel ViaMob360 — NÃO EDITAR AQUI. ═══
// Altere no painel e rode `npm run sync:app` lá.

// Padrão de dados comum a todo o ViaMob360 (painel web e app).
// Usado em shared/shemas/viamob360/colecoes.ts e shared/gen/gen.ts.
// Regra desta pasta: TS puro, sem import de fora dela — o app reaproveita
// os mesmos arquivos (npm run sync:app).
//
// Tenant = MUNICÍPIO: cada prefeitura é um `cliente` (sistema "VIAMOB360") com
// o seu `path`, e todos os dados ficam em /dados/{path}/{colecao}/{id}. Por
// isso as coleções NÃO repetem `id_municipios` (a doc pede o campo para
// segregar; o caminho já segrega) — só `municipios` guarda o cadastro e a
// identidade visual do próprio município.

// Registros imutáveis (livro-razão / log / trilha): só created_at, nunca
// updated_at. Correção se faz com um novo registro.
export const LISTA_COLECOES_IMUTAVEIS = [
  "logs_auditoria", "eventos_corrida", "pontos_gps_corrida", "acoes_incidente", "mensagens_chamado",
] as const;

export const ehColecaoImutavel = (colecao: string) => (LISTA_COLECOES_IMUTAVEIS as readonly string[]).includes(colecao);

// Origem gravada no log de auditoria por cada canal.
export const ORIGENS_AUDITORIA = ["painel_web", "app", "sistema"] as const;

// Módulos do ViaMob360 — seções de coleções da doc (item 5) — usados em
// anexos, notificações, logs, permissões e na Carga de Dados.
export const MODULOS = [
  "nucleo", "pessoas_veiculos", "tarifas", "corridas", "financeiro", "beneficios", "programas", "empresas", "seguranca", "fiscalizacao", "atendimento", "site",
] as const;
export type ModuloSistema = (typeof MODULOS)[number];
export const ROTULOS_MODULO: Record<ModuloSistema, string> = {
  nucleo: "Configuração e acesso",
  pessoas_veiculos: "Pessoas e veículos",
  tarifas: "Categorias, tarifas e zonas",
  corridas: "Corridas",
  financeiro: "Financeiro",
  beneficios: "Benefícios e parceiros",
  programas: "Programas municipais e eventos",
  empresas: "Empresas (contas corporativas)",
  seguranca: "Segurança e incidentes",
  fiscalizacao: "Fiscalização",
  atendimento: "Atendimento",
  site: "Site público",
};

// Coleções de cada módulo — fonte única (colecoes.ts tipa a partir daqui e
// acesso.ts usa como recursos da matriz de permissões).
export const MODULOS_COLECOES = {
  nucleo: ["municipios", "usuarios", "perfis", "permissoes", "configuracoes", "notificacoes", "anexos", "logs_auditoria", "dispositivos", "sessoes", "sincronizacoes"],
  pessoas_veiculos: ["passageiros", "enderecos_passageiros", "motoristas", "veiculos", "documentos_motoristas", "documentos_veiculos", "vistorias_veiculos"],
  tarifas: ["categorias_servico", "tarifas", "zonas_tarifarias", "regras_tarifarias"],
  corridas: ["solicitacoes_corridas", "ofertas_corridas", "corridas", "eventos_corrida", "rotas_corridas", "pontos_gps_corrida", "cancelamentos_corrida", "avaliacoes", "localizacoes_motoristas", "localizacoes_passageiros"],
  financeiro: ["pagamentos", "carteiras", "transacoes", "repasses", "cupons", "vouchers", "cartoes_passageiros"],
  beneficios: ["beneficios", "parceiros_beneficios", "beneficios_parceiros"],
  programas: ["programas_mobilidade", "beneficiarios_programas", "eventos_municipais"],
  empresas: ["empresas", "usuarios_empresas", "centros_custo", "politicas_empresas"],
  seguranca: ["incidentes", "alertas_seguranca", "acoes_incidente"],
  fiscalizacao: ["fiscalizacoes"],
  atendimento: ["chamados_suporte", "mensagens_chamado"],
  site: ["configuracoes_site", "paginas_site", "avisos_site", "perguntas_frequentes", "leads_site"],
} as const satisfies Record<ModuloSistema, readonly string[]>;

export const moduloDaColecao = (colecao: string): ModuloSistema =>
  MODULOS.find((m) => (MODULOS_COLECOES[m] as readonly string[]).includes(colecao)) ?? "nucleo";

// Código humano dos registros de baixo volume (o id do documento é técnico):
// PREFIXO-ANO-0001. Ex.: formatarCodigo("INC", 2026, 17) → "INC-2026-0017".
// Corridas NÃO usam sequência (milhares por dia, criadas offline em vários
// aparelhos): o código delas é curto e aleatório (codigoCorrida).
export const formatarCodigo = (prefixo: string, ano: number, sequencia: number, digitos = 4) =>
  `${prefixo}-${ano}-${String(sequencia).padStart(digitos, "0")}`;
export const PREFIXOS_CODIGO = {
  incidentes: "INC",
  fiscalizacoes: "FIS",
  chamados_suporte: "ATD",
} as const;

// Código da corrida (mostrado ao passageiro, ao motorista e no suporte):
// "MV-" + 6 caracteres sem ambiguidade (sem 0/O, 1/I). `bytes` vem do
// gerador seguro de cada lado (crypto no painel, expo-crypto no app).
const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const codigoCorrida = (bytes: ArrayLike<number>) =>
  "MV-" + Array.from(bytes).slice(0, 6).map((b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join("");

// Prioridade/criticidade — mesma escala em incidentes e chamados.
export const PRIORIDADES = ["baixa", "media", "alta", "critica"] as const;
export const ROTULOS_PRIORIDADE: Record<(typeof PRIORIDADES)[number], string> = { baixa: "Baixa", media: "Média", alta: "Alta", critica: "Crítica" };

export type MapaTransicoes<S extends string> = Record<S, readonly S[]>;
export function podeTransitar<S extends string>(mapa: MapaTransicoes<S>, de: S, para: S): boolean {
  return de === para || (mapa[de] ?? []).includes(para);
}

// Dinheiro: SEMPRE em centavos inteiros nas coleções (doc 5.1) — campos
// terminados em `_centavos`. Reais só na tela.
export const paraCentavos = (reais: any) => Math.round((Number(String(reais ?? "").replace(",", ".")) || 0) * 100);
export const brl = (centavos: any) =>
  `R$ ${((Number(centavos) || 0) / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
