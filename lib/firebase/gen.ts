// Camada de dados do site ViaMob360, no padrão do `shared/gen/gen.ts` do
// painel (ViaMob360): getAll com onSnapshot e id sequencial via
// dados/{tenant}/incrementKey/{colecao}.
//
// O tenant é fixo por implantação: `PORTAL_PATH` no .env (repassado ao
// navegador pelo next.config.js); case-sensitive, é o `path` de um cliente
// VIAMOB360 na coleção `cliente`.
// Sem valor padrão de propósito: nunca ler/gravar no tenant errado.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

export const TENANT_PATH = process.env.PORTAL_PATH || undefined;

function caminhoTenant(): string {
  if (!TENANT_PATH) {
    throw new Error(
      "PORTAL_PATH não configurado — defina no .env (ou nas env vars do deploy) qual é o tenant deste site antes de ler/gravar no Firestore.",
    );
  }
  return `dados/${TENANT_PATH}`;
}
const colRef = (colecao: string, tenant?: string) => collection(db, `${tenant ? `dados/${tenant}` : caminhoTenant()}/${colecao}`);

// Listener em tempo real de uma coleção inteira — mesmo formato do `getAll` do painel.
export function getAll(colecao: string, callback: (docs: any[]) => void): Unsubscribe {
  return onSnapshot(colRef(colecao), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// Leitura pontual (servidor e navegador). `tenant` = outro município (cidades).
export async function getAllOnce(colecao: string, tenant?: string): Promise<any[]> {
  const snap = await getDocs(colRef(colecao, tenant));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDocOnce(colecao: string, id: string): Promise<any | null> {
  const snap = await getDoc(doc(colRef(colecao), id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Listener de um documento (o chat do visitante: status, agente).
export function getDocOn(colecao: string, id: string, callback: (doc: any | null) => void): Unsubscribe {
  return onSnapshot(doc(colRef(colecao), id), (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null));
}

// Listener filtrado por um campo (as mensagens de um chat). Sem orderBy de
// propósito: evita índice composto no Firestore — quem chama ordena.
export function filtrarOn(colecao: string, campo: string, valor: any, callback: (docs: any[]) => void): Unsubscribe {
  return onSnapshot(query(colRef(colecao), where(campo, "==", valor)), (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// Grava com id escolhido, SEM carimbar datas: as coleções do OmniChannel
// (chats, messages, contatos_omnichannel) usam `created_at` em ms, como o
// Core do painel.
export async function gravarComId(colecao: string, id: string, dados: Record<string, any>, mesclar = false): Promise<void> {
  await setDoc(doc(colRef(colecao), id), dados, { merge: mesclar });
}

// Documento novo com id automático, sem carimbar datas (mensagens do chat).
export async function gravarNovo(colecao: string, dados: Record<string, any>): Promise<string> {
  const ref = doc(colRef(colecao));
  await setDoc(ref, dados);
  return ref.id;
}

// Cria com id sequencial — mesma mecânica do `onSaveIncrement` do painel
// (transação em incrementKey/{colecao}, id = número em texto, created_at e
// updated_at carimbados). Usado pelos formulários do site (leads_site).
export async function criarComIdSequencial(colecao: string, data: Record<string, any>): Promise<string> {
  const base = caminhoTenant();
  const counterRef = doc(db, `${base}/incrementKey`, colecao);
  const id = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const proximo = ((snap.data()?.countKey as number | undefined) ?? 0) + 1;
    if (snap.exists()) t.update(counterRef, { countKey: proximo });
    else t.set(counterRef, { countKey: proximo });
    return String(proximo);
  });
  const agora = new Date();
  await setDoc(doc(colRef(colecao), id), { ...data, created_at: agora, updated_at: agora });
  return id;
}

// Coleção RAIZ `cliente` (lista os municípios VIAMOB360). Pode estar
// fechada pelas regras do Firestore — quem chama trata o erro.
export async function listarClientesViaMob(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "cliente"), where("sistema", "==", "VIAMOB360")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
