// ═══ GERADO a partir do painel ViaMob360 — NÃO EDITAR AQUI. ═══
// Altere no painel e rode `npm run sync:app` lá.

// ═══ COMPARTILHADO painel ⇄ app do parceiro ═══════════════════════════════
// Validações e máscaras de campos de cadastro (CPF, CNPJ, telefone, e-mail,
// CEP, UF, hora, data, placa). Um só lugar: formulários do painel e do app
// usam `validarCampo(tipo, valor)` — devolve a mensagem do problema ou null.
// Campo vazio é válido (obrigatoriedade é outra regra: `{ obrigatorio: true }`).

export const soDigitos = (v: any): string => String(v ?? "").replace(/\D/g, "");

// ── CPF / CNPJ ───────────────────────────────────────────────────────────
function digitoMod11(numeros: number[], pesos: number[]): number {
  const resto = numeros.reduce((s, n, i) => s + n * pesos[i], 0) % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(valor: any): boolean {
  const d = soDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const n = d.split("").map(Number);
  const d1 = digitoMod11(n.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoMod11(n.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === n[9] && d2 === n[10];
}

export function cnpjValido(valor: any): boolean {
  const d = soDigitos(valor);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const n = d.split("").map(Number);
  const d1 = digitoMod11(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoMod11(n.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === n[12] && d2 === n[13];
}

// CPF ou CNPJ, pelo tamanho.
export const documentoValido = (valor: any) => (soDigitos(valor).length > 11 ? cnpjValido(valor) : cpfValido(valor));

// ── Telefone (Brasil) ────────────────────────────────────────────────────
// Aceita com ou sem +55, com DDD: fixo (10 dígitos) ou celular (11, começando
// em 9), e números 0800/0300/0500 (ex.: 0800 092 3400 — válido também como
// WhatsApp Business). Devolve só os dígitos nacionais, ou null se inválido.
export function telefoneNacional(valor: any): string | null {
  let d = soDigitos(valor);
  if (/^0[358]00\d{6,7}$/.test(d)) return d;                 // 0800 092 3400
  if (/^[358]00\d{7}$/.test(d)) return d;                    // 800 092 3400 (como a Meta mostra)
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11 && d[0] === "0") return null;
  if (d.length !== 10 && d.length !== 11) return null;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (d.length === 11 && d[2] !== "9") return null;          // celular começa em 9
  if (d.length === 10 && !/[2-5]/.test(d[2])) return null;   // fixo começa em 2–5
  if (/^(\d)\1+$/.test(d.slice(2))) return null;
  return d;
}
export const telefoneValido = (valor: any) => telefoneNacional(valor) !== null;
export const celularValido = (valor: any) => { const d = telefoneNacional(valor); return !!d && (d.length === 11 || /^0?[358]00/.test(d)); };

// Número para o WhatsApp (wa.me): dígitos com DDI 55; 0800 vai como está.
export function numeroWhatsapp(valor: any): string | null {
  const d = telefoneNacional(valor);
  if (!d) return null;
  return /^0?[358]00/.test(d) ? d.replace(/^0/, "") : `55${d}`;
}

// ── E-mail, CEP, UF, hora, data, placa ───────────────────────────────────
export function emailValido(valor: any): boolean {
  const e = String(valor ?? "").trim();
  return e.length <= 254 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(e) && !e.includes("..");
}
export const cepValido = (valor: any) => /^\d{8}$/.test(soDigitos(valor)) && !/^(\d)\1{7}$/.test(soDigitos(valor));
export const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;
export const ufValida = (valor: any) => (UFS as readonly string[]).includes(String(valor ?? "").trim().toUpperCase());
export const horaValida = (valor: any) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(valor ?? "").trim());
// Placa antiga (ABC1234) ou Mercosul (ABC1D23).
export const placaValida = (valor: any) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(String(valor ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""));

// "DD/MM/AAAA" (e opcional "HH:mm") → Date real (31/02 é recusado); null se
// inválida. É o que os formulários do app digitam; no banco vai como Date
// (o Firestore grava Timestamp) — padrão de dados do projeto.
export function lerDataBr(texto: any, fimDoDia = false): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(String(texto ?? "").trim());
  if (!m) return null;
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = m[4] ? Number(m[4]) : fimDoDia ? 23 : 0, min = m[5] ? Number(m[5]) : fimDoDia ? 59 : 0;
  if (ano < 1900 || ano > 2100 || h > 23 || min > 59) return null;
  const d = new Date(ano, mes - 1, dia, h, min);
  return d.getDate() === dia && d.getMonth() === mes - 1 ? d : null;
}
export const dataValida = (valor: any) => lerDataBr(valor) !== null;

// ── máscaras (exibição e enquanto digita) ────────────────────────────────
export function formatarCpf(valor: any): string {
  const d = soDigitos(valor).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
}
export function formatarCnpj(valor: any): string {
  const d = soDigitos(valor).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}
export const formatarDocumento = (valor: any) => (soDigitos(valor).length > 11 ? formatarCnpj(valor) : formatarCpf(valor));
export function formatarTelefone(valor: any): string {
  let d = soDigitos(valor);
  if (/^0?[358]00/.test(d)) { d = d.replace(/^0?/, "0").slice(0, 11); return d.replace(/^(\d{4})(\d{0,3})(\d{0,4}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" ")); }
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const corte = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}${d.length > corte ? `-${d.slice(corte)}` : ""}`;
}
export function formatarCep(valor: any): string {
  const d = soDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
// Enquanto digita: "01102026" → "01/10/2026"; "0800" → "08:00".
export function mascararData(valor: any): string {
  const d = soDigitos(valor).slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join("/");
}
export function mascararHora(valor: any): string {
  const d = soDigitos(valor).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

// ── porta única ──────────────────────────────────────────────────────────
export type TipoCampo = "cpf" | "cnpj" | "documento" | "telefone" | "celular" | "email" | "cep" | "uf" | "hora" | "data" | "placa";

const REGRAS: Record<TipoCampo, { valido: (v: any) => boolean; mensagem: string }> = {
  cpf: { valido: cpfValido, mensagem: "CPF inválido." },
  cnpj: { valido: cnpjValido, mensagem: "CNPJ inválido." },
  documento: { valido: documentoValido, mensagem: "CPF/CNPJ inválido." },
  telefone: { valido: telefoneValido, mensagem: "Telefone inválido — informe com DDD." },
  celular: { valido: celularValido, mensagem: "Celular inválido — informe com DDD e o 9." },
  email: { valido: emailValido, mensagem: "E-mail inválido." },
  cep: { valido: cepValido, mensagem: "CEP inválido." },
  uf: { valido: ufValida, mensagem: "UF inválida." },
  hora: { valido: horaValida, mensagem: "Hora inválida — use HH:mm." },
  data: { valido: dataValida, mensagem: "Data inválida — use DD/MM/AAAA." },
  placa: { valido: placaValida, mensagem: "Placa inválida." },
};

// Mensagem do problema, ou null se o valor é válido. Vazio só é problema com
// `obrigatorio`. `rotulo` troca o começo da mensagem ("WhatsApp inválido…").
export function validarCampo(tipo: TipoCampo, valor: any, opcoes: { obrigatorio?: boolean; rotulo?: string } = {}): string | null {
  const vazio = String(valor ?? "").trim() === "";
  if (vazio) return opcoes.obrigatorio ? `${opcoes.rotulo ?? "Campo"}: obrigatório.` : null;
  const regra = REGRAS[tipo];
  if (regra.valido(valor)) return null;
  return opcoes.rotulo ? `${opcoes.rotulo}: ${regra.mensagem.charAt(0).toLowerCase()}${regra.mensagem.slice(1)}` : regra.mensagem;
}

// Valida vários campos de uma vez: [{ campo, tipo, valor, ... }] → problemas.
export function validarCampos(campos: { campo: string; tipo: TipoCampo; valor: any; obrigatorio?: boolean; rotulo?: string }[]): { campo: string; mensagem: string }[] {
  return campos
    .map((c) => ({ campo: c.campo, mensagem: validarCampo(c.tipo, c.valor, c) }))
    .filter((p): p is { campo: string; mensagem: string } => p.mensagem !== null);
}

// Máscara do tipo (para o campo ir se formatando enquanto a pessoa digita).
export function mascarar(tipo: TipoCampo, valor: any): string {
  switch (tipo) {
    case "cpf": return formatarCpf(valor);
    case "cnpj": return formatarCnpj(valor);
    case "documento": return formatarDocumento(valor);
    case "telefone": case "celular": return formatarTelefone(valor);
    case "cep": return formatarCep(valor);
    case "data": return mascararData(valor);
    case "hora": return mascararHora(valor);
    case "uf": return String(valor ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    case "placa": return String(valor ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
    default: return String(valor ?? "");
  }
}
