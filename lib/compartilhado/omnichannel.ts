// ═══ GERADO a partir do painel ViaMob360 — NÃO EDITAR AQUI. ═══
// Altere no painel e rode `npm run sync:app` lá.

// OmniChannel (Core, vindo do hcCore) — regras puras do atendimento, iguais
// em qualquer produto (ViaMob360, PetGo360...). Sem import de produto: o que
// é do produto fica no adaptador (shared/function/omnichannel/produto.ts).
//
// Coleções do Core (nomes do hcCore — o back-end do WhatsApp usa esses):
// - `chats`: a conversa. Entra na FILA dos agentes com status "novo",
//   novo "0" e o `id_puc` da central; o agente aceita → "em atendimento".
// - `messages`: as mensagens (`idChat`). `from_user.usuario_tipo` "externo"
//   = quem é atendido.
// - `contatos_omnichannel`: QUEM é atendido (WhatsApp, e-mail, voz, app).
//   Antes ia para `usuarios`, que nos produtos é a coleção de LOGIN —
//   separado para não misturar. O vínculo com o cadastro do produto
//   (ViaMob360: passageiro/motorista) fica em `vinculo_colecao` +
//   `vinculo_id`, e o login do app em `id_usuarios` (para notificar).

export const ORIGENS_CHAT = ["whatsapp", "email", "voice", "app", "site", "painel", "chat"] as const;
export type OrigemChat = (typeof ORIGENS_CHAT)[number];

export const STATUS_CHAT_FILA = "novo";
export const STATUS_CHAT_ABERTO = ["em atendimento", "nova mensagem", "respondida"] as const;

// Telefone só com dígitos e sem o 55. O WhatsApp manda "5592991234567" (às
// vezes sem o 9 do celular); o cadastro guarda "92991234567".
export function digitosTelefone(t: unknown): string {
  let d = String(t ?? "").replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d;
}

// Formas do mesmo número para procurar no banco (com/sem o 9, com/sem 55).
export function variantesTelefone(t: unknown): string[] {
  const d = digitosTelefone(t);
  if (d.length < 10) return d ? [d] : [];
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const base = new Set<string>([d]);
  if (resto.length === 9 && resto.startsWith("9")) base.add(ddd + resto.slice(1));
  if (resto.length === 8) base.add(ddd + "9" + resto);
  const todas = new Set<string>();
  base.forEach((v) => { todas.add(v); todas.add("55" + v); });
  return Array.from(todas);
}

export const avatarDoNome = (nome: unknown) => (String(nome ?? "").replace(/[^a-zA-Z]/g, "").charAt(0) || "").toUpperCase();

export type VinculoContato = { vinculo_colecao: string | null; vinculo_id: string | null; vinculo_rotulo: string | null; id_usuarios: string | null };
export const SEM_VINCULO: VinculoContato = { vinculo_colecao: null, vinculo_id: null, vinculo_rotulo: null, id_usuarios: null };

// Contato de quem usa o APP: id fixo por login (o app grava sem consultar,
// offline) e já vinculado ao cadastro do produto.
export const idContatoApp = (idUsuarios: string) => `app_${idUsuarios}`;

export function montarContatoApp(p: { idUsuarios: string; nome: string; telefone?: string | null; email?: string | null; vinculo: VinculoContato; agora: number }) {
  return {
    nome: (p.nome || "").toUpperCase(),
    telefone: digitosTelefone(p.telefone) || null,
    email: (p.email || "").toLowerCase() || null,
    origem: "app" as OrigemChat,
    avatar: avatarDoNome(p.nome),
    ...p.vinculo,
    id_usuarios: p.idUsuarios,
    time: p.agora,
    last_access: p.agora,
  };
}

// Chat aberto pelo APP (passageiro/motorista falando com a central): nasce
// na fila da central configurada para o app (Parâmetros, grupo
// "atendimento", chave "puc_app" — id ou nome do PUC). Sem comando para o
// back-end: o app lê `messages` direto do banco.
export function montarChatApp(p: {
  idChat: string; idPuc: string; texto: string; agora: number;
  contato: { id: string; nome: string; telefone?: string | null; email?: string | null; avatar?: string };
  vinculo: VinculoContato; assunto?: string | null; idCorridas?: string | null;
}) {
  const de = { id: p.vinculo.id_usuarios || p.contato.id, nome: p.contato.nome, avatar: p.contato.avatar || avatarDoNome(p.contato.nome), usuario_tipo: "externo" };
  const mensagem = {
    idChat: p.idChat, body: p.texto, attachment: null, from_user: de, userFrom: true,
    viewed_at: null, created_at: p.agora, userId: de.id, userCreate: de.id, prioridade: "",
  };
  const titulo = (p.assunto || "Atendimento pelo app") + " - " + p.idChat;
  const chat = {
    user_requester: { ...p.contato, origem: "app" }, user: null,
    unseen_count: 1, viewed_at: null, created_at: p.agora, time: p.agora,
    nome: p.contato.nome, origem: "app" as OrigemChat, prioridade: "nenhuma",
    novo: "0", status: STATUS_CHAT_FILA, id_agente: null, id_lotacao: null, id_puc: p.idPuc,
    id_solicitante: p.contato.id, id_contatos_omnichannel: p.contato.id, ...p.vinculo,
    id_corridas: p.idCorridas ?? null,
    tramitado: "0", last_message: mensagem, menu: p.assunto || "Atendimento pelo app", titulo, value: p.texto,
    telefone: digitosTelefone(p.contato.telefone) || null, id_canal: p.vinculo.id_usuarios, email: p.contato.email || null, protocolo: p.idChat,
  };
  return { chat, mensagem };
}

type Config = { grupo?: string; chave?: string; valor?: unknown; status?: string };

// PUC que recebe os chats do app: o parâmetro aceita o id ou o nome.
export const pucDoApp = (configuracoes: Config[], pucs: { id: string; nome?: string }[]) => pucDoParametro(configuracoes, pucs, ["puc_app"]);
// PUC do chat do SITE: "puc_site" e, sem ele, o mesmo do app.
export const pucDoSite = (configuracoes: Config[], pucs: { id: string; nome?: string }[]) => pucDoParametro(configuracoes, pucs, ["puc_site", "puc_app"]);

function pucDoParametro(configuracoes: Config[], pucs: { id: string; nome?: string }[], chaves: string[]): string | null {
  let v = "";
  for (const chave of chaves) {
    v = String(configuracoes.find((c) => c.grupo === "atendimento" && c.chave === chave && c.status !== "inativo")?.valor ?? "").trim();
    if (v) break;
  }
  if (!v) return pucs[0]?.id ?? null;
  const achado = pucs.find((p) => p.id === v) || pucs.find((p) => (p.nome || "").trim().toLowerCase() === v.toLowerCase());
  return achado?.id ?? null;
}

// ── Chat do SITE (botão "Chat com a Central" do site público) ─────────────
// O visitante escolhe o ASSUNTO e informa o NOME; o contato nasce sem
// telefone (o agente pede o que precisar na conversa) com id fixo por
// navegador (`site_<token>`, guardado no site), e o chat entra na fila da
// central do site. Sem comando ao back-end: o site lê `messages`.
export const idContatoSite = (token: string) => `site_${token}`;
export const assuntoPrioritario = (assunto: string) => /seguran|emerg/i.test(assunto || "");

export function montarContatoSite(p: { token: string; nome: string; agora: number }) {
  return {
    nome: (p.nome || "").trim().toUpperCase(), telefone: null, email: null, origem: "site" as OrigemChat,
    avatar: avatarDoNome(p.nome), ...SEM_VINCULO, time: p.agora, last_access: p.agora,
  };
}

export function montarChatSite(p: { idChat: string; idPuc: string; token: string; nome: string; assunto: string; agora: number }) {
  const idContato = idContatoSite(p.token);
  const nome = (p.nome || "").trim().toUpperCase();
  const de = { id: idContato, nome, avatar: avatarDoNome(nome), usuario_tipo: "externo" };
  const texto = `Assunto: ${p.assunto}`;
  const mensagem = {
    idChat: p.idChat, body: texto, attachment: null, from_user: de, userFrom: true,
    viewed_at: null, created_at: p.agora, userId: de.id, userCreate: de.id, prioridade: "",
  };
  const chat = {
    user_requester: { id: idContato, nome, avatar: de.avatar, origem: "site" }, user: null,
    unseen_count: 1, viewed_at: null, created_at: p.agora, time: p.agora,
    nome, origem: "site" as OrigemChat, prioridade: assuntoPrioritario(p.assunto) ? "alta" : "nenhuma",
    novo: "0", status: STATUS_CHAT_FILA, id_agente: null, id_lotacao: null, id_puc: p.idPuc,
    id_solicitante: idContato, id_contatos_omnichannel: idContato, ...SEM_VINCULO,
    tramitado: "0", last_message: mensagem, menu: p.assunto, titulo: `${p.assunto} - ${p.idChat}`, value: texto,
    telefone: null, id_canal: idContato, email: null, protocolo: p.idChat,
  };
  return { chat, mensagem };
}

// Mensagem do visitante numa conversa já aberta.
export function montarMensagemSite(p: { idChat: string; token: string; nome: string; texto: string; agora: number }) {
  const idContato = idContatoSite(p.token);
  const nome = (p.nome || "").trim().toUpperCase();
  return {
    idChat: p.idChat, body: p.texto, attachment: null,
    from_user: { id: idContato, nome, avatar: avatarDoNome(nome), usuario_tipo: "externo" }, userFrom: true,
    viewed_at: null, created_at: p.agora, userId: idContato, userCreate: idContato, prioridade: "",
  };
}

// Protocolo legível do atendimento do site (o id do documento do chat).
export const protocoloSite = (agora: number, aleatorio: string) => protocoloChat("SITE", agora, aleatorio);

// ── Conversa padrão (site e app usam as MESMAS perguntas) ─────────────────
// Saudação → botões de ASSUNTO → (site: pede o nome; app: identifica pelo
// login) → abre o atendimento com a 1ª mensagem "Assunto: X" e a resposta
// automática com o protocolo. Assuntos e saudação podem vir da Configuração
// do site (configuracoes_site.chat_*); vazio = estes padrões.
export const ASSUNTOS_CHAT_PADRAO = [
  "Informações sobre uma corrida",
  "Segurança / emergência",
  "Cadastro de motorista parceiro",
  "Pagamentos e carteira",
  "Objetos perdidos",
  "Outros assuntos",
];
export const SAUDACAO_CHAT_PADRAO = "Olá! 👋 Sou a Central ViaMob360. Como podemos ajudar?";

export function respostaInicialChat(assunto: string, protocolo: string): string {
  let r = "Certo. Seu atendimento foi direcionado para a fila correta e um atendente vai assumir a conversa em instantes.";
  if (assuntoPrioritario(assunto)) r = "Se houver risco imediato, ligue 190 ou use o SOS no aplicativo. Descreva o ocorrido e informe o protocolo da viagem — seu atendimento tem prioridade.";
  else if (/corrida|viage/i.test(assunto)) r = "Informe o protocolo da corrida ou o telefone utilizado na solicitação. Um atendente vai localizar a viagem.";
  return `${r}
Protocolo: ${protocolo}`;
}

// Protocolo legível (= id do documento do chat): PREFIXO-AAAAMMDD-XXXXX.
export function protocoloChat(prefixo: "SITE" | "APP", agora: number, aleatorio: string): string {
  const d = new Date(agora);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${prefixo}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${aleatorio.toUpperCase().slice(0, 5)}`;
}

// Mensagem de quem é atendido numa conversa aberta (app: id do contato do app).
export function montarMensagemExterna(p: { idChat: string; idRemetente: string; nome: string; texto: string; agora: number }) {
  const nome = (p.nome || "").trim().toUpperCase();
  return {
    idChat: p.idChat, body: p.texto, attachment: null,
    from_user: { id: p.idRemetente, nome, avatar: avatarDoNome(nome), usuario_tipo: "externo" }, userFrom: true,
    viewed_at: null, created_at: p.agora, userId: p.idRemetente, userCreate: p.idRemetente, prioridade: "",
  };
}

// Vínculo de quem usa o APP, pelo login e pelo modo (identificação
// automática: ninguém digita nome). Usuário = equipe/fiscal (perfil de acesso).
export function vinculoDoApp(p: { modo: "passageiro" | "motorista" | "fiscal"; idUsuarios: string; idPassageiro?: string | null; idMotorista?: string | null; rotuloPerfil?: string }): VinculoContato {
  if (p.modo === "motorista" && p.idMotorista) return { vinculo_colecao: "motoristas", vinculo_id: p.idMotorista, vinculo_rotulo: "Motorista", id_usuarios: p.idUsuarios };
  if (p.modo === "passageiro" && p.idPassageiro) return { vinculo_colecao: "passageiros", vinculo_id: p.idPassageiro, vinculo_rotulo: "Passageiro", id_usuarios: p.idUsuarios };
  return { vinculo_colecao: "usuarios", vinculo_id: p.idUsuarios, vinculo_rotulo: p.rotuloPerfil ? `Usuário (${p.rotuloPerfil})` : "Usuário", id_usuarios: p.idUsuarios };
}
