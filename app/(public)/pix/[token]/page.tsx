import type { Metadata } from "next";
import PagarPix from "@/components/pix/PagarPix";

// Página pública do Pix pedido pelo WhatsApp (botão "Pagar com Pix" do robô):
// QR Code + "Copiar código". O token (16 caracteres aleatórios) vem de
// pagamentos.token_pix (corrida/pendência) ou assinaturas_motoristas.token_pix
// (mensalidade do motorista) — gravados pelo back-end.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pagar com Pix", robots: { index: false, follow: false } };

export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PagarPix token={String(token || "").slice(0, 40)} />;
}
