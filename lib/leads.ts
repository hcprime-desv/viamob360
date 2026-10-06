// Formulários do site → `leads_site` (módulo Site do painel → Interessados).
// Validação espelha o LeadSiteShema do painel, com o MESMO validarCampo
// (lib/compartilhado/validacoes.ts, gerado pelo painel). LGPD: só grava com
// o aceite (aceite_lgpd + aceite_em). Prefeitura não tem formulário próprio
// no site (tudo da prefeitura é no painel): usa o Contato, assunto
// "Prefeitura / órgão público".
import { criarComIdSequencial } from "@/lib/firebase/gen";
import { validarCampo } from "@/lib/compartilhado/validacoes";

export type TipoFormulario = "motorista" | "empresa" | "contato";
export const ASSUNTOS_CONTATO = ["Dúvida", "Sugestão", "Reclamação", "Prefeitura / órgão público", "Imprensa", "Outro"] as const;

export type DadosLead = {
  nome: string; email: string; telefone: string; municipio: string; uf: string;
  cpf: string; veiculo: string; cnpj: string; razao_social: string; colaboradores_estimados: string;
  assunto: string; mensagem: string; aceite: boolean;
};
export const LEAD_VAZIO: DadosLead = {
  nome: "", email: "", telefone: "", municipio: "", uf: "", cpf: "", veiculo: "", cnpj: "", razao_social: "", colaboradores_estimados: "",
  assunto: "", mensagem: "", aceite: false,
};

export function validarLead(tipo: TipoFormulario, d: DadosLead): Record<string, string> {
  const e: Record<string, string> = {};
  const p = (campo: string, msg: string | null) => { if (msg) e[campo] = msg; };
  if (!d.nome.trim()) e.nome = "Informe o nome.";
  p("email", validarCampo("email", d.email, { rotulo: "E-mail" }));
  p("telefone", validarCampo("telefone", d.telefone, { rotulo: "Celular" }));
  if (!d.email.trim() && !d.telefone.trim()) e.telefone = "Informe e-mail ou celular.";
  if (tipo === "motorista") {
    p("cpf", validarCampo("cpf", d.cpf, { rotulo: "CPF", obrigatorio: true }));
    if (!d.municipio.trim()) e.municipio = "Informe o município.";
  }
  if (tipo === "empresa") {
    if (!d.razao_social.trim()) e.razao_social = "Informe a razão social.";
    p("cnpj", validarCampo("cnpj", d.cnpj, { rotulo: "CNPJ" }));
  }
  if (tipo === "contato" && !d.mensagem.trim()) e.mensagem = "Escreva a sua mensagem.";
  if (d.uf && validarCampo("uf", d.uf)) e.uf = "UF inválida.";
  if (!d.aceite) e.aceite = "É preciso aceitar a Política de Privacidade.";
  return e;
}

const dig = (v: string) => v.replace(/\D/g, "");
const ou = (v: string) => (v.trim() ? v.trim() : null);

export async function enviarLead(tipo: TipoFormulario, d: DadosLead): Promise<string> {
  const agora = new Date();
  const tipoLead = tipo === "contato" && d.assunto === "Imprensa" ? "imprensa" : tipo;
  return criarComIdSequencial("leads_site", {
    tipo: tipoLead, nome: d.nome.trim(), email: ou(d.email.toLowerCase()), telefone: dig(d.telefone),
    municipio: d.municipio.trim(), uf: d.uf.trim().toUpperCase(),
    cpf: dig(d.cpf), veiculo: ou(d.veiculo), orgao: null, cargo: null,
    cnpj: dig(d.cnpj), razao_social: ou(d.razao_social),
    colaboradores_estimados: d.colaboradores_estimados ? Number(dig(d.colaboradores_estimados)) || null : null,
    assunto: ou(d.assunto), veiculo_imprensa: null, mensagem: ou(d.mensagem),
    origem: "site", aceite_lgpd: true, aceite_em: agora, status: "novo", observacoes: null, contatado_em: null, recebido_em: agora,
  });
}
