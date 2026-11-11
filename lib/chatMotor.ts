// Chat do site no MESMO MOTOR do WhatsApp (componente do monorepo, copiado por scripts/copiar-chat-site.py).
// Só liga com NEXT_PUBLIC_CHAT_PATH (tenant onde roda o chatbot e o back-end que atende o canal site); sem ela, o site segue
// com o chat da fila do admsite360 (components/chat/ChatCentral.tsx).
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, firebaseApp } from "./firebase/client";
import { criarMotorSite } from "@/components/chat/motorSite";

const TENANT = process.env.NEXT_PUBLIC_CHAT_PATH;
async function upload(f: File): Promise<string> {
  const r = ref(getStorage(firebaseApp), `chat_site/${Date.now()}_${f.name}`);
  await uploadBytes(r, f);
  return getDownloadURL(r);
}

export const motorChat = TENANT ? criarMotorSite({ db, tenant: TENANT, upload, chaveLocal: "viamob_contato_chat" }) : null;
