import type { Metadata } from "next";
import PagarCartao from "@/components/pix/PagarCartao";

// Página do CARTÃO POR LINK (pedido pelo WhatsApp no modelo percentual): o
// token vem de pagamentos.token_pix (gravado pelo back-end). Ambiente de
// teste: não coleta dados de cartão — com o gateway real, o link do WhatsApp
// passa a ser o checkout do provedor (pagamentos.link_pagamento).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pagar com cartão", robots: { index: false, follow: false } };

export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PagarCartao token={String(token || "").slice(0, 40)} />;
}
