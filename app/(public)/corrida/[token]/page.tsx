import type { Metadata } from "next";
import AcompanharCorrida from "@/components/corrida/AcompanharCorrida";

// Link público de acompanhamento de uma corrida pedida pelo WhatsApp
// (painel: shared/compartilhado/pedidoCanal.ts → linkAcompanhamento). O token é
// aleatório (16 caracteres) e só mostra o necessário: situação, primeiro nome
// do motorista, carro/placa e a posição ENQUANTO a corrida está ativa.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acompanhar corrida", robots: { index: false, follow: false } };

export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AcompanharCorrida token={String(token || "").slice(0, 40)} />;
}
