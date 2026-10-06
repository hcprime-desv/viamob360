// Chat com a Central — o atendimento REAL do site, na fila do OmniChannel do
// painel (tenant do site). Regras do Core em lib/compartilhado/omnichannel.ts
// (geradas pelo painel — `npm run sync:app` lá):
// assunto → nome → contato (`contatos_omnichannel`, id fixo por navegador)
// + chat (`chats`, id = protocolo) na fila da central do site + mensagens
// (`messages`). O agente responde pelo Chat do painel e a resposta aparece
// aqui em tempo real. Nada vai para o back-end do WhatsApp (origem "site").
import { increment, type Unsubscribe } from "firebase/firestore";
import { filtrarOn, getAllOnce, getDocOn, gravarComId, gravarNovo } from "@/lib/firebase/gen";
import {
  STATUS_CHAT_ABERTO, idContatoSite, respostaInicialChat, montarChatSite, montarContatoSite, montarMensagemSite, protocoloSite, pucDoSite,
} from "@/lib/compartilhado/omnichannel";

export type Sessao = { token: string; idChat: string | null; nome: string; assunto: string };
export type MensagemChat = { id: string; texto: string; doVisitante: boolean; autor: string; em: number };

const CHAVE = "viamob_chat";
const aleatorio = (n: number) => Array.from({ length: n }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");

export function lerSessao(): Sessao {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (s?.token) return { token: s.token, idChat: s.idChat ?? null, nome: s.nome ?? "", assunto: s.assunto ?? "" };
  } catch { /* aba anônima/sem storage: sessão só desta visita */ }
  return { token: aleatorio(12), idChat: null, nome: "", assunto: "" };
}
export function salvarSessao(s: Sessao) {
  try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch { /* idem */ }
}

// Resposta automática da Central (mesma do app): lib/compartilhado/omnichannel.ts.
export const respostaInicial = respostaInicialChat;

// Abre o atendimento: contato + chat na fila da central do site + 1ª mensagem.
export async function iniciarAtendimento(sessao: Sessao, nome: string, assunto: string, cidade?: string | null): Promise<string> {
  const [configuracoes, pucs] = await Promise.all([getAllOnce("configuracoes"), getAllOnce("puc")]);
  const idPuc = pucDoSite(configuracoes, pucs.filter((p) => p.status !== "Cancelado"));
  if (!idPuc) throw new Error("A Central ainda não está configurada para receber atendimentos pelo site.");
  const agora = Date.now();
  const idChat = protocoloSite(agora, aleatorio(5));
  await gravarComId("contatos_omnichannel", idContatoSite(sessao.token), { ...montarContatoSite({ token: sessao.token, nome, agora }), created_at: agora }, true);
  const { chat, mensagem } = montarChatSite({ idChat, idPuc, token: sessao.token, nome, assunto, agora });
  await gravarComId("chats", idChat, { ...chat, cidade: cidade ?? null });
  await gravarNovo("messages", mensagem);
  return idChat;
}

// Mensagem do visitante numa conversa aberta: grava e avisa o agente
// (contador de não lidas + "nova mensagem" se já estiver em atendimento).
export async function enviarMensagem(sessao: Sessao, statusAtual: string | undefined, texto: string): Promise<void> {
  if (!sessao.idChat) return;
  const agora = Date.now();
  const msg = montarMensagemSite({ idChat: sessao.idChat, token: sessao.token, nome: sessao.nome, texto, agora });
  await gravarNovo("messages", msg);
  const emAtendimento = (STATUS_CHAT_ABERTO as readonly string[]).includes(statusAtual ?? "");
  await gravarComId("chats", sessao.idChat, {
    last_message: msg, value: texto, time: agora, unseen_count: increment(1), ...(emAtendimento ? { status: "nova mensagem" } : {}),
  }, true);
}

export function ouvirChat(idChat: string, cb: (chat: any | null) => void): Unsubscribe {
  return getDocOn("chats", idChat, cb);
}

export function ouvirMensagens(sessao: Sessao, cb: (m: MensagemChat[]) => void): Unsubscribe {
  if (!sessao.idChat) return () => {};
  const meu = idContatoSite(sessao.token);
  return filtrarOn("messages", "idChat", sessao.idChat, (docs) => {
    cb(docs
      .filter((d) => typeof d.body === "string" && d.body.trim())
      .map((d) => ({
        id: d.id, texto: d.body, doVisitante: d.from_user?.id === meu,
        autor: d.from_user?.id === meu ? sessao.nome : d.from_user?.nome || "Central", em: Number(d.created_at) || 0,
      }))
      .sort((a, b) => a.em - b.em));
  });
}

export const chatEncerrado = (chat: any) => ["finalizado", "fechado", "encerrado"].includes(String(chat?.status || "").toLowerCase());
