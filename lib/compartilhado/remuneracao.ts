// ═══ GERADO a partir do painel ViaMob360 — NÃO EDITAR AQUI. ═══
// Altere no painel e rode `npm run sync:app` lá.

// MODELO COMERCIAL da operação (dono, 20/10/2026) — definido pelo OPERADOR em
// Configurações da operação → aba "Modelo comercial" (operacoes.remuneracao).
// A regra ÚNICA é `regrasComerciais(cfg)`: o app, o WhatsApp, o painel e o
// back-end decidem forma de pagamento, pagamento antecipado e taxa operacional
// por ela — nunca comparando o modelo direto.
//
//   Modelo comercial / forma de remuneração da plataforma:
//   - "percentual": a plataforma recebe a corrida e fica com o percentual de
//     tecnologia (+ parcela da operadora) da tarifa;
//   - "assinatura": o motorista paga uma mensalidade fixa; a plataforma não
//     fica com nada da corrida (motorista 100%);
//   - "assinatura_franquia": mensalidade com uma FRANQUIA de N corridas no mês;
//     acabou antes da renovação → o motorista compra PACOTES extras de corridas
//     (senão não recebe novas corridas até comprar ou o mês virar).
//   Recebedor da corrida (só nas assinaturas; no percentual é sempre a plataforma):
//   - "plataforma": o passageiro paga à conta gestora e o valor vai para a
//     carteira do motorista; o pagamento é OBRIGATORIAMENTE ANTECIPADO (antes
//     de buscar motorista), no app e no WhatsApp;
//   - "direto" (motorista parceiro): o passageiro paga ao motorista (dinheiro,
//     Pix dele, maquininha); SEM pagamento antecipado e SEM taxa operacional.
//   Pagamento antecipado: obrigatório com recebedor plataforma na assinatura;
//   proibido no direto; no percentual o operador escolhe (sim = só Pix/cartão,
//   cobrados antes da busca). No WhatsApp o pagamento é sempre antes (Pix; no
//   percentual também cartão por LINK).
//   Taxa operacional por corrida: o operador escolhe (sim/não); nunca no direto.
import type { Escrita } from "./escritas";

export const MODELOS_REMUNERACAO = ["percentual", "assinatura", "assinatura_franquia"] as const;
export type ModeloRemuneracao = (typeof MODELOS_REMUNERACAO)[number];
export const ROTULOS_MODELO_REMUNERACAO: Record<ModeloRemuneracao, string> = {
  percentual: "Percentual sobre a corrida",
  assinatura: "Assinatura mensal do motorista",
  assinatura_franquia: "Assinatura + franquia de corridas",
};
export const ehModeloAssinatura = (m: string | null | undefined) => m === "assinatura" || m === "assinatura_franquia";

export const RECEBIMENTOS_ASSINATURA = ["plataforma", "direto"] as const;
export type RecebimentoAssinatura = (typeof RECEBIMENTOS_ASSINATURA)[number];
export const ROTULOS_RECEBIMENTO_ASSINATURA: Record<RecebimentoAssinatura, string> = {
  plataforma: "Plataforma (o passageiro paga antes à conta gestora; o valor vai para a carteira do motorista)",
  direto: "Motorista parceiro (o passageiro paga direto ao motorista; sem pagamento antecipado nem taxa operacional)",
};

// Formas de pagamento no recebimento direto (o dinheiro vai direto ao motorista).
export const METODOS_PAGAMENTO_DIRETO = ["dinheiro", "pix_motorista", "cartao_maquininha"] as const;
export type MetodoDireto = (typeof METODOS_PAGAMENTO_DIRETO)[number];
export const ehPagamentoDireto = (m: string | null | undefined) => (METODOS_PAGAMENTO_DIRETO as readonly string[]).includes(String(m ?? ""));
// Pagamento antecipado (antes da busca): Pix ou cartão (salvo, no app; por link, no WhatsApp).
export const METODOS_ANTECIPADOS = ["pix", "cartao_credito", "cartao_debito"] as const;
export const ehMetodoAntecipado = (m: string | null | undefined) => (METODOS_ANTECIPADOS as readonly string[]).includes(String(m ?? ""));

export type ConfigRemuneracao = {
  modelo: ModeloRemuneracao;
  recebimento: RecebimentoAssinatura; // só vale nas assinaturas
  pagamentoAntecipado: boolean; // escolha do operador no percentual (nas assinaturas é derivado)
  taxaOperacional: boolean; // cobra a taxa operacional da tarifa (nunca no direto)
  valorMensalCentavos: number;
  valoresPorCategoria: Record<string, number>; // codigo da categoria → centavos
  diaVencimento: number; // 1..28
  diasCarencia: number;
  franquiaCorridas: number; // corridas incluídas na mensalidade (assinatura_franquia)
  pacoteExtraCorridas: number; // corridas de cada pacote extra
  pacoteExtraCentavos: number; // preço do pacote extra
};
export const CONFIG_REMUNERACAO_PADRAO: ConfigRemuneracao = {
  modelo: "percentual", recebimento: "plataforma", pagamentoAntecipado: true, taxaOperacional: true,
  valorMensalCentavos: 9900, valoresPorCategoria: {}, diaVencimento: 10, diasCarencia: 5,
  franquiaCorridas: 60, pacoteExtraCorridas: 10, pacoteExtraCentavos: 3000,
};

const inteiro = (v: any, padrao: number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : padrao;
};
const booleano = (v: any, padrao: boolean) => (v === true || v === "true" ? true : v === false || v === "false" ? false : padrao);

export function configRemuneracao(operacao: Record<string, any> | null | undefined): ConfigRemuneracao {
  const r = operacao?.remuneracao ?? {};
  const p = CONFIG_REMUNERACAO_PADRAO;
  const porCategoria: Record<string, number> = {};
  for (const [codigo, v] of Object.entries(r.valores_por_categoria_centavos ?? {})) {
    const n = Math.round(Number(v));
    if (Number.isFinite(n) && n >= 0) porCategoria[codigo] = n;
  }
  return {
    modelo: (MODELOS_REMUNERACAO as readonly string[]).includes(r.modelo) ? r.modelo : "percentual",
    recebimento: r.recebimento === "direto" ? "direto" : "plataforma",
    pagamentoAntecipado: booleano(r.pagamento_antecipado, p.pagamentoAntecipado),
    taxaOperacional: booleano(r.taxa_operacional, p.taxaOperacional),
    valorMensalCentavos: inteiro(r.valor_mensal_centavos, p.valorMensalCentavos),
    valoresPorCategoria: porCategoria,
    diaVencimento: inteiro(r.dia_vencimento, p.diaVencimento, 1, 28),
    diasCarencia: inteiro(r.dias_carencia, p.diasCarencia, 0, 60),
    franquiaCorridas: inteiro(r.franquia_corridas, p.franquiaCorridas, 1, 100000),
    pacoteExtraCorridas: inteiro(r.pacote_extra_corridas, p.pacoteExtraCorridas, 1, 100000),
    pacoteExtraCentavos: inteiro(r.pacote_extra_centavos, p.pacoteExtraCentavos),
  };
}

// ── A REGRA ÚNICA do pagamento da corrida ────────────────────────────────
export type RegrasComerciais = {
  modelo: ModeloRemuneracao;
  remuneracaoPlataforma: ModeloRemuneracao; // = modelo (rótulo da tela)
  assinatura: boolean; // tem mensalidade
  franquia: boolean; // tem franquia de corridas
  recebedor: "plataforma" | "motorista";
  pagamentoAntecipado: boolean; // o app cobra antes de buscar motorista
  taxaOperacional: boolean; // cobra a taxa operacional da tarifa
  metodosApp: string[]; // formas que o passageiro escolhe no app
  metodosWhatsapp: string[]; // formas no WhatsApp ("cartao_link" = cartão por link)
};
export function regrasComerciais(cfg: Pick<ConfigRemuneracao, "modelo" | "recebimento" | "pagamentoAntecipado" | "taxaOperacional">): RegrasComerciais {
  const assinatura = ehModeloAssinatura(cfg.modelo);
  const direto = assinatura && cfg.recebimento === "direto";
  const antecipado = direto ? false : assinatura ? true : cfg.pagamentoAntecipado;
  return {
    modelo: cfg.modelo, remuneracaoPlataforma: cfg.modelo, assinatura, franquia: cfg.modelo === "assinatura_franquia",
    recebedor: direto ? "motorista" : "plataforma",
    pagamentoAntecipado: antecipado,
    taxaOperacional: direto ? false : cfg.taxaOperacional,
    metodosApp: direto ? [...METODOS_PAGAMENTO_DIRETO] : antecipado ? [...METODOS_ANTECIPADOS] : ["pix", "cartao_credito", "cartao_debito", "carteira", "dinheiro"],
    metodosWhatsapp: direto ? [...METODOS_PAGAMENTO_DIRETO] : assinatura ? ["pix"] : ["pix", "cartao_link"],
  };
}
export const regrasDaOperacao = (operacao: Record<string, any> | null | undefined) => regrasComerciais(configRemuneracao(operacao));
// Texto curto da configuração (painel, log, app).
export function resumoRegras(r: RegrasComerciais): string {
  return [
    ROTULOS_MODELO_REMUNERACAO[r.modelo],
    `recebe: ${r.recebedor === "motorista" ? "motorista" : "plataforma"}`,
    `pagamento antecipado: ${r.pagamentoAntecipado ? "sim" : "não"}`,
    `taxa operacional: ${r.taxaOperacional ? "sim" : "não"}`,
  ].join(" · ");
}

export const ehAssinatura = (operacao: Record<string, any> | null | undefined) => ehModeloAssinatura(configRemuneracao(operacao).modelo);
// O passageiro paga DIRETO ao motorista? (assinatura com recebedor motorista).
export const pagamentoDiretoAoMotorista = (cfg: Pick<ConfigRemuneracao, "modelo" | "recebimento">) => ehModeloAssinatura(cfg.modelo) && cfg.recebimento === "direto";
export const recebeDireto = (operacao: Record<string, any> | null | undefined) => pagamentoDiretoAoMotorista(configRemuneracao(operacao));

// Percentuais da corrida: nas assinaturas não há taxa nem parcela da
// operadora — o motorista fica com 100% (repartirCorrida com zeros).
export function percentuaisDoModelo(modelo: ModeloRemuneracao | string, tarifa: Record<string, any> | null | undefined) {
  if (ehModeloAssinatura(modelo)) return { percentual_tecnologia: 0, percentual_operadora: 0 };
  return { percentual_tecnologia: Number(tarifa?.percentual_tecnologia) || 0, percentual_operadora: Number(tarifa?.percentual_operadora) || 0 };
}

// Formas que o PASSAGEIRO pode escolher no pedido do app.
export function metodoPermitido(cfg: Pick<ConfigRemuneracao, "modelo" | "recebimento" | "pagamentoAntecipado" | "taxaOperacional">, metodo: string): boolean {
  return regrasComerciais(cfg).metodosApp.includes(metodo);
}

// ── Mensalidade ──────────────────────────────────────────────────────────
export const STATUS_ASSINATURA = ["pendente", "paga", "isenta", "cancelada"] as const;
export type StatusAssinatura = (typeof STATUS_ASSINATURA)[number];
export const ROTULOS_STATUS_ASSINATURA: Record<StatusAssinatura, string> = { pendente: "A pagar", paga: "Paga", isenta: "Isenta", cancelada: "Cancelada" };
export const TRANSICOES_ASSINATURAS: Record<StatusAssinatura, StatusAssinatura[]> = {
  pendente: ["paga", "isenta", "cancelada"], paga: [], isenta: [], cancelada: [],
};

// "AAAA-MM" do mês da data.
export const competenciaDe = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export function rotuloCompetencia(c: string): string {
  const [a, m] = c.split("-").map(Number);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return a && m ? `${meses[m - 1]}/${a}` : c;
}
export function vencimentoDa(competencia: string, cfg: ConfigRemuneracao): Date {
  const [a, m] = competencia.split("-").map(Number);
  return new Date(a, m - 1, cfg.diaVencimento, 23, 59, 59);
}
export const valorAssinatura = (cfg: ConfigRemuneracao, codigoCategoria: string | null | undefined) =>
  codigoCategoria && cfg.valoresPorCategoria[codigoCategoria] != null ? cfg.valoresPorCategoria[codigoCategoria] : cfg.valorMensalCentavos;

const ms = (v: any): number => {
  if (v == null || v === "") return NaN;
  if (v instanceof Date) return v.getTime();
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  return new Date(v).getTime();
};
const DIA = 86400000;

export type SituacaoAssinatura = {
  situacao: "nao_se_aplica" | "em_dia" | "a_vencer" | "vencida_carencia" | "bloqueado";
  // Mensalidade em aberto mais antiga (a que manda na situação).
  emAberto: Record<string, any> | null;
  diasAtraso: number;
  bloqueia: boolean; // não pode ficar online
  mensagem: string;
};

export const TIPOS_ASSINATURA = ["mensalidade", "pacote_extra"] as const;
export const ROTULOS_TIPO_ASSINATURA: Record<(typeof TIPOS_ASSINATURA)[number], string> = { mensalidade: "Mensalidade", pacote_extra: "Pacote extra de corridas" };
export const ehMensalidade = (a: Record<string, any>) => (a?.tipo ?? "mensalidade") === "mensalidade";

// Situação do motorista no modelo assinatura: a mensalidade pendente mais
// antiga decide. Vencida há mais de `diasCarencia` dias → bloqueia ficar
// online (como a suspensão por cancelamentos).
export function situacaoAssinatura(p: { cfg: ConfigRemuneracao; assinaturas: any[]; agora?: Date }): SituacaoAssinatura {
  const agora = (p.agora ?? new Date()).getTime();
  if (!ehModeloAssinatura(p.cfg.modelo)) return { situacao: "nao_se_aplica", emAberto: null, diasAtraso: 0, bloqueia: false, mensagem: "" };
  // Pacote extra em aberto não bloqueia (só não soma corridas até ser pago).
  const abertas = (p.assinaturas ?? []).filter((a) => a.status === "pendente" && ehMensalidade(a)).sort((a, b) => ms(a.vencimento_em) - ms(b.vencimento_em));
  const a = abertas[0] ?? null;
  if (!a) return { situacao: "em_dia", emAberto: null, diasAtraso: 0, bloqueia: false, mensagem: "Assinatura em dia." };
  const venc = ms(a.vencimento_em);
  const valor = (Number(a.valor_centavos) || 0) / 100;
  const reais = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (!Number.isFinite(venc) || agora <= venc) {
    return { situacao: "a_vencer", emAberto: a, diasAtraso: 0, bloqueia: false, mensagem: `Mensalidade de ${rotuloCompetencia(a.competencia)} (${reais}) vence em ${new Date(venc).toLocaleDateString("pt-BR")}.` };
  }
  const diasAtraso = Math.floor((agora - venc) / DIA) + 1;
  if (diasAtraso > p.cfg.diasCarencia) {
    return { situacao: "bloqueado", emAberto: a, diasAtraso, bloqueia: true, mensagem: `Mensalidade de ${rotuloCompetencia(a.competencia)} (${reais}) atrasada há ${diasAtraso} dia(s). Pague para voltar a ficar online.` };
  }
  const restam = p.cfg.diasCarencia - diasAtraso;
  return { situacao: "vencida_carencia", emAberto: a, diasAtraso, bloqueia: false, mensagem: `Mensalidade de ${rotuloCompetencia(a.competencia)} (${reais}) venceu. Pague em até ${restam} dia(s) para não ficar bloqueado.` };
}

// Cobranças do mês: uma mensalidade "pendente" por motorista ATIVO que ainda
// não tem a da competência. `categoriaDoMotorista` = codigo da categoria do
// veículo em uso (valor por categoria). Idempotente (não duplica).
export function planejarMensalidades(p: {
  cfg: ConfigRemuneracao; competencia: string; motoristas: any[]; existentes: any[]; categoriaDoMotorista: (m: any) => string | null;
}): Escrita[] {
  if (!ehModeloAssinatura(p.cfg.modelo)) return [];
  const ja = new Set(p.existentes.filter((a) => a.competencia === p.competencia && a.status !== "cancelada" && ehMensalidade(a)).map((a) => String(a.id_motoristas)));
  const venc = vencimentoDa(p.competencia, p.cfg);
  return p.motoristas
    .filter((m) => m.status === "ativo" && !ja.has(String(m.id)))
    .map((m) => ({
      tipo: "criar" as const, colecao: "assinaturas_motoristas",
      dados: {
        id_motoristas: String(m.id), competencia: p.competencia, valor_centavos: valorAssinatura(p.cfg, p.categoriaDoMotorista(m)),
        tipo: "mensalidade", corridas_incluidas: p.cfg.modelo === "assinatura_franquia" ? p.cfg.franquiaCorridas : null,
        vencimento_em: venc, status: "pendente", metodo: null, copia_cola_pix: null, codigo_externo: null, pix_expira_em: null,
        pago_em: null, baixa_manual: false, observacao: null,
      },
    }));
}

// Baixa da mensalidade (webhook do Pix, ou manual pelo painel com observação).
export function planejarBaixaAssinatura(p: { assinatura: Record<string, any>; metodo: string; manual: boolean; observacao?: string | null; codigoExterno?: string | null; agora?: Date }): Escrita[] {
  if (p.assinatura.status !== "pendente") throw new Error(`Mensalidade "${p.assinatura.status}" não pode receber baixa.`);
  if (p.manual && !String(p.observacao ?? "").trim()) throw new Error("Informe a observação da baixa manual (ex.: comprovante recebido).");
  return [{
    tipo: "atualizar", colecao: "assinaturas_motoristas", id: String(p.assinatura.id),
    dados: { status: "paga", metodo: p.metodo, pago_em: p.agora ?? new Date(), baixa_manual: p.manual, observacao: p.observacao?.trim() || p.assinatura.observacao || null, codigo_externo: p.codigoExterno ?? p.assinatura.codigo_externo ?? null },
  }];
}

// Resumo para os KPIs do painel.
export function resumoAssinaturas(p: { cfg: ConfigRemuneracao; assinaturas: any[]; competencia: string; agora?: Date }) {
  const agora = (p.agora ?? new Date()).getTime();
  const doMes = p.assinaturas.filter((a) => a.competencia === p.competencia && a.status !== "cancelada");
  const soma = (xs: any[]) => xs.reduce((t, a) => t + (Number(a.valor_centavos) || 0), 0);
  const pendentes = p.assinaturas.filter((a) => a.status === "pendente" && ehMensalidade(a));
  const atrasoDias = (a: any) => Math.floor((agora - ms(a.vencimento_em)) / DIA) + 1;
  const vencidas = pendentes.filter((a) => Number.isFinite(ms(a.vencimento_em)) && agora > ms(a.vencimento_em));
  return {
    previstoMesCentavos: soma(doMes.filter((a) => a.status !== "isenta")),
    recebidoMesCentavos: soma(doMes.filter((a) => a.status === "paga")),
    pagasMes: doMes.filter((a) => a.status === "paga").length,
    aPagarMes: doMes.filter((a) => a.status === "pendente").length,
    emCarencia: vencidas.filter((a) => atrasoDias(a) <= p.cfg.diasCarencia).length,
    bloqueados: new Set(vencidas.filter((a) => atrasoDias(a) > p.cfg.diasCarencia).map((a) => String(a.id_motoristas))).size,
  };
}

// ── Franquia de corridas (assinatura_franquia) ───────────────────────────
// Incluídas no mês = franquia da mensalidade + pacotes extras PAGOS da
// competência. Usadas = corridas finalizadas pelo motorista no mês (fim_em).
// Esgotou → não recebe novas corridas até comprar um pacote extra ou o mês virar.
export type SituacaoFranquia = { aplica: boolean; incluidas: number; usadas: number; restantes: number; esgotada: boolean; mensagem: string };
export function situacaoFranquia(p: { cfg: ConfigRemuneracao; assinaturas: any[]; corridas: any[]; agora?: Date }): SituacaoFranquia {
  if (p.cfg.modelo !== "assinatura_franquia") return { aplica: false, incluidas: 0, usadas: 0, restantes: Infinity, esgotada: false, mensagem: "" };
  const agora = p.agora ?? new Date();
  const comp = competenciaDe(agora);
  const doMes = (p.assinaturas ?? []).filter((a) => a.competencia === comp && a.status !== "cancelada");
  const mensal = doMes.find((a) => ehMensalidade(a));
  const daMensalidade = mensal ? Number(mensal.corridas_incluidas ?? p.cfg.franquiaCorridas) || 0 : p.cfg.franquiaCorridas;
  const extras = doMes.filter((a) => a.tipo === "pacote_extra" && a.status === "paga").reduce((s, a) => s + (Number(a.corridas_incluidas) || 0), 0);
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
  const usadas = (p.corridas ?? []).filter((c) => c.status === "finalizada" && ms(c.fim_em ?? c.updated_at) >= inicio).length;
  const incluidas = daMensalidade + extras;
  const restantes = Math.max(0, incluidas - usadas);
  return {
    aplica: true, incluidas, usadas, restantes, esgotada: restantes <= 0,
    mensagem: restantes <= 0
      ? `Franquia de ${rotuloCompetencia(comp)} esgotada (${usadas} de ${incluidas} corridas). Compre um pacote extra para receber novas corridas.`
      : `Franquia de ${rotuloCompetencia(comp)}: ${usadas} de ${incluidas} corridas usadas (restam ${restantes}).`,
  };
}
// Pacote extra de corridas: cobrança avulsa (Pix) na própria assinaturas_motoristas.
export function planejarPacoteExtra(p: { cfg: ConfigRemuneracao; idMotorista: string; agora?: Date }): Escrita[] {
  if (p.cfg.modelo !== "assinatura_franquia") throw new Error("Pacote extra só existe no modelo assinatura + franquia.");
  const agora = p.agora ?? new Date();
  return [{
    tipo: "criar", colecao: "assinaturas_motoristas", ref: "pacote",
    dados: {
      id_motoristas: String(p.idMotorista), competencia: competenciaDe(agora), valor_centavos: p.cfg.pacoteExtraCentavos,
      tipo: "pacote_extra", corridas_incluidas: p.cfg.pacoteExtraCorridas, vencimento_em: agora, status: "pendente",
      metodo: null, copia_cola_pix: null, codigo_externo: null, pix_expira_em: null, pago_em: null, baixa_manual: false, observacao: null,
    },
  }];
}
