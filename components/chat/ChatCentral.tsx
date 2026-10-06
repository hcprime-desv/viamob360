"use client";

// Chat com a Central — modelo do wireframe (ViaMob360_Wireframe_Site.html):
// saudação → botões de ASSUNTO → a Central pede o NOME → o atendimento abre
// de verdade na fila do OmniChannel (lib/chat.ts) e a conversa segue em
// tempo real com o agente do painel. Duas visões da MESMA conversa: a janela
// flutuante (botão 💬 em todas as páginas) e o painel embutido da Home
// (como em site_principal.png).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Headset, Minus, Paperclip, SendHorizontal } from "lucide-react";
import { useCidades, useConfiguracao } from "@/components/public/AoVivo";
import {
  chatEncerrado, enviarMensagem, iniciarAtendimento, lerSessao, ouvirChat, ouvirMensagens, respostaInicial, salvarSessao,
  type MensagemChat, type Sessao,
} from "@/lib/chat";

type Bolha = { id: string; texto: string; quem: "agent" | "user"; autor?: string; em?: number };
type Etapa = "assunto" | "nome" | "conversa" | "encerrado";
type Estado = {
  aberto: boolean; abrir: (assunto?: string) => void; fechar: () => void; alternar: () => void;
  etapa: Etapa; bolhas: Bolha[]; assuntos: string[]; escolherAssunto: (a: string) => void;
  enviar: (texto: string) => Promise<void>; enviando: boolean; erro: string; novoAtendimento: () => void; titulo: string;
};
const Contexto = createContext<Estado | null>(null);
export const useChat = () => {
  const e = useContext(Contexto);
  if (!e) throw new Error("useChat fora do ChatProvider");
  return e;
};

const ASSUNTO_LIVRE = "Outros assuntos";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const cfg = useConfiguracao();
  const { cidade } = useCidades();
  const [aberto, setAberto] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [assunto, setAssunto] = useState("");
  const [pendente, setPendente] = useState(""); // texto digitado antes do nome
  const [remotas, setRemotas] = useState<MensagemChat[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => { const s = lerSessao(); setSessao(s); if (s.idChat) setAssunto(s.assunto); }, []);
  useEffect(() => {
    if (!sessao?.idChat) { setRemotas([]); setChat(null); return; }
    const a = ouvirMensagens(sessao, setRemotas);
    const b = ouvirChat(sessao.idChat, setChat);
    return () => { a(); b(); };
  }, [sessao?.idChat]); // eslint-disable-line react-hooks/exhaustive-deps

  const etapa: Etapa = sessao?.idChat ? (chatEncerrado(chat) ? "encerrado" : "conversa") : assunto ? "nome" : "assunto";

  const escolherAssunto = useCallback((a: string) => { setErro(""); setAssunto(a); setAberto(true); }, []);
  const abrir = useCallback((a?: string) => { setAberto(true); if (a && !sessao?.idChat) escolherAssunto(a); }, [sessao?.idChat, escolherAssunto]);

  const enviar = useCallback(async (texto: string) => {
    const t = texto.trim();
    if (!t || !sessao || enviando) return;
    setErro("");
    if (etapa === "assunto") { setPendente(t); setAssunto(ASSUNTO_LIVRE); return; }
    if (etapa === "encerrado") return;
    setEnviando(true);
    try {
      if (etapa === "nome") {
        if (t.length < 2) { setErro("Informe o seu nome."); return; }
        const idChat = await iniciarAtendimento(sessao, t, assunto, cidade ? `${cidade.nome}${cidade.uf ? "/" + cidade.uf : ""}` : null);
        const nova = { ...sessao, idChat, nome: t, assunto };
        salvarSessao(nova); setSessao(nova);
        if (pendente) { await enviarMensagem(nova, "novo", pendente); setPendente(""); }
      } else {
        await enviarMensagem(sessao, chat?.status, t);
      }
    } catch (e: any) {
      setErro(e?.message || "Não foi possível enviar agora. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }, [sessao, enviando, etapa, assunto, cidade, pendente, chat?.status]);

  const novoAtendimento = useCallback(() => {
    if (!sessao) return;
    const nova = { token: sessao.token, idChat: null, nome: "", assunto: "" };
    salvarSessao(nova); setSessao(nova); setAssunto(""); setPendente(""); setErro("");
  }, [sessao]);

  const bolhas = useMemo<Bolha[]>(() => {
    const b: Bolha[] = [{ id: "saudacao", texto: cfg.chatSaudacao, quem: "agent" }];
    if (!assunto) return b;
    b.push({ id: "assunto", texto: assunto, quem: "user" });
    if (pendente && !sessao?.idChat) b.push({ id: "pendente", texto: pendente, quem: "user" });
    b.push({ id: "pede-nome", texto: cfg.chatPerguntaNome, quem: "agent" });
    if (!sessao?.idChat) return b;
    b.push({ id: "nome", texto: sessao.nome, quem: "user" });
    b.push({ id: "resposta", texto: respostaInicial(assunto, sessao.idChat), quem: "agent" });
    remotas.forEach((m, i) => {
      if (i === 0 && m.doVisitante && m.texto.startsWith("Assunto:")) return; // 1ª mensagem = o assunto (já mostrado)
      b.push({ id: m.id, texto: m.texto, quem: m.doVisitante ? "user" : "agent", autor: m.doVisitante ? undefined : m.autor, em: m.em });
    });
    if (chatEncerrado(chat)) b.push({ id: "fim", texto: "Atendimento encerrado. Obrigado por falar com a Central!", quem: "agent" });
    return b;
  }, [cfg.chatSaudacao, cfg.chatPerguntaNome, assunto, pendente, sessao, remotas, chat]);

  const valor: Estado = {
    aberto, abrir, fechar: () => setAberto(false), alternar: () => setAberto((v) => !v),
    etapa, bolhas, assuntos: cfg.chatAssuntos, escolherAssunto, enviar, enviando, erro, novoAtendimento, titulo: cfg.chatTitulo,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

const hora = (ms?: number) => (ms ? new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

// Corpo da conversa (bolhas + botões de assunto + aviso de erro).
function Conversa({ variante }: { variante: "janela" | "painel" }) {
  const { bolhas, etapa, assuntos, escolherAssunto, erro, novoAtendimento } = useChat();
  // Rola só a caixa da conversa (scrollIntoView rolaria a página inteira).
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const caixa = fim.current?.parentElement;
    if (caixa && bolhas.length > 1) caixa.scrollTop = caixa.scrollHeight; // no início, mostra a saudação
  }, [bolhas.length]);
  return (
    <>
      {bolhas.map((b, i) => (
        <div key={b.id} className={`linha-bolha ${b.quem}`}>
          {variante === "painel" && b.quem === "agent" && <span className="avatar-central" aria-hidden><Headset size={16} /></span>}
          <div className={`bubble ${b.quem}`}>
            {b.autor && <b className="autor">{b.autor}</b>}
            {b.texto.split("\n").map((l, k) => <span key={k} className="l">{l}</span>)}
            {b.em ? <small className="hora">{hora(b.em)}</small> : null}
          </div>
          {i === 0 && etapa === "assunto" && (
            <div className="quick">
              {assuntos.map((a) => <button key={a} type="button" onClick={() => escolherAssunto(a)}>{a}</button>)}
            </div>
          )}
        </div>
      ))}
      {etapa === "encerrado" && (
        <div className="quick"><button type="button" onClick={novoAtendimento}>Iniciar novo atendimento</button></div>
      )}
      {erro && <div className="chat-erro" role="alert">{erro}</div>}
      <div ref={fim} />
    </>
  );
}

function Entrada({ variante }: { variante: "janela" | "painel" }) {
  const { etapa, enviar, enviando } = useChat();
  const [texto, setTexto] = useState("");
  const placeholder = etapa === "nome" ? "Digite seu nome..." : etapa === "encerrado" ? "Atendimento encerrado" : "Digite sua mensagem...";
  const mandar = async () => { const t = texto; if (!t.trim()) return; setTexto(""); await enviar(t); };
  return (
    <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void mandar(); }}>
      {variante === "painel" && <span className="clip" aria-hidden><Paperclip size={17} /></span>}
      <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        disabled={etapa === "encerrado" || enviando} autoComplete={etapa === "nome" ? "name" : "off"} />
      {variante === "janela"
        ? <button className="send" type="submit" disabled={enviando}>Enviar</button>
        : <button className="send send-icone" type="submit" disabled={enviando} aria-label="Enviar"><SendHorizontal size={18} /></button>}
    </form>
  );
}

// Janela flutuante + botão 💬 (wireframe: .chat-launch / .chat).
export function ChatFlutuante() {
  const { aberto, alternar, titulo } = useChat();
  return (
    <>
      <button className="chat-launch" onClick={alternar} aria-label={aberto ? "Fechar chat" : "Abrir chat com a Central"} aria-expanded={aberto}>
        💬<span className="chat-badge" />
      </button>
      <div className={`chat${aberto ? " open" : ""}`} role="dialog" aria-label={titulo}>
        <div className="chat-head">
          <div><b>{titulo}</b><small>● Online • atendimento 24h</small></div>
          <button type="button" onClick={alternar} aria-label="Minimizar chat"><Minus size={20} /></button>
        </div>
        <div className="chat-body" aria-live="polite"><Conversa variante="janela" /></div>
        <Entrada variante="janela" />
      </div>
    </>
  );
}

// Painel embutido da Home (site_principal.png: "Chat com a Central 24h").
export function ChatPainel() {
  const { titulo } = useChat();
  return (
    <div className="chat-painel" id="central">
      <div className="chat-painel-head">
        <span className="ic-central" aria-hidden><Headset size={22} /></span>
        <div>
          <b>{titulo} 24h</b>
          <small>Atendimento seguro e em tempo real para suporte, informações e emergências.</small>
        </div>
        <span className="online">● Online</span>
      </div>
      <div className="chat-painel-body" aria-live="polite"><Conversa variante="painel" /></div>
      <Entrada variante="painel" />
    </div>
  );
}
