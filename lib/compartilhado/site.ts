// ═══ GERADO a partir do painel ViaMob360 — NÃO EDITAR AQUI. ═══
// Altere no painel e rode `npm run sync:app` lá.

// Site público (projeto site/ViaMob360) — regras puras que o painel (módulo
// Site) e o site aplicam igual: tipos e funil dos interessados (leads_site),
// públicos do FAQ e quando um aviso está no ar. Só "./" (vai para o site).
import type { MapaTransicoes } from "./dados";

export const TIPOS_LEAD = ["motorista", "prefeitura", "empresa", "contato", "imprensa"] as const;
export type TipoLead = (typeof TIPOS_LEAD)[number];
export const ROTULOS_TIPO_LEAD: Record<TipoLead, string> = {
  motorista: "Motorista parceiro", prefeitura: "Prefeitura", empresa: "Empresa", contato: "Contato", imprensa: "Imprensa",
};

export const STATUS_LEAD = ["novo", "em_contato", "convertido", "descartado"] as const;
export type StatusLead = (typeof STATUS_LEAD)[number];
export const ROTULOS_STATUS_LEAD: Record<StatusLead, string> = {
  novo: "Novo", em_contato: "Em contato", convertido: "Convertido", descartado: "Descartado",
};
export const TRANSICOES_LEADS_SITE: MapaTransicoes<StatusLead> = {
  novo: ["em_contato", "convertido", "descartado"],
  em_contato: ["convertido", "descartado"],
  convertido: [],
  descartado: ["novo"],
};

export const PUBLICOS_FAQ = ["geral", "passageiro", "motorista", "prefeitura", "empresa"] as const;
export type PublicoFaq = (typeof PUBLICOS_FAQ)[number];
export const ROTULOS_PUBLICO_FAQ: Record<PublicoFaq, string> = {
  geral: "Geral", passageiro: "Passageiro", motorista: "Motorista parceiro", prefeitura: "Prefeitura", empresa: "Empresa",
};

const ms = (v: any): number => {
  if (v == null || v === "") return NaN;
  if (typeof v === "number") return v;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.toDate === "function") return v.toDate().getTime();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  return new Date(v).getTime();
};

// Aviso aparece no site: ativo e dentro do período (fim vazio = sem prazo).
export const avisoNoAr = (a: { status?: string; inicio_em?: unknown; fim_em?: unknown }, agora = Date.now()) =>
  a.status === "ativo" && ms(a.inicio_em) <= agora && (!a.fim_em || ms(a.fim_em) > agora);
