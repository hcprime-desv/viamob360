"use client";

import { useEffect, useState } from "react";
import { filtrarOn } from "@/lib/firebase/gen";

// Cartão por link (pedido pelo WhatsApp, modelo percentual), em tempo real.
// AMBIENTE DE TESTE: a página não pede nem guarda dados de cartão — o
// back-end aprova sozinho depois de alguns segundos (gateway simulado). Com o
// gateway real, o botão do WhatsApp abre o checkout do provedor.
const brl = (c: any) => (Number(c) / 100 || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ms = (v: any) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() : 0);

export default function PagarCartao({ token }: { token: string }) {
  const [pagamento, setPagamento] = useState<any | null | undefined>(undefined);
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!token) return;
    const parar = filtrarOn("pagamentos", "token_pix", token, (d) => setPagamento(d[0] ?? null));
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => { parar(); clearInterval(t); };
  }, [token]);

  const doc = pagamento ?? null;
  const pago = doc?.status === "aprovado";
  const expira = doc ? ms(doc.pix_expira_em) : 0;
  const vencido = !!doc && !pago && expira > 0 && expira < agora;
  const cancelado = !!doc && ["cancelado", "estornado", "recusado"].includes(doc.status);
  const restante = expira > agora ? Math.ceil((expira - agora) / 1000) : 0;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520, textAlign: "center" }}>
        <div className="eyebrow">Pagar com cartão</div>
        {pagamento === undefined ? <p className="texto-mut">Carregando…</p> : !doc ? (
          <>
            <h1 className="h2-grande">Pagamento não encontrado</h1>
            <p className="texto-mut">O link pode estar incompleto. Volte ao WhatsApp e peça de novo.</p>
          </>
        ) : pago ? (
          <>
            <div style={{ fontSize: 56 }}>✅</div>
            <h1 className="h2-grande">Pagamento aprovado</h1>
            <p className="texto-mut">Corrida (preço fechado) · {brl(doc.valor_centavos)}. Já estamos chamando o motorista: volte ao WhatsApp.</p>
          </>
        ) : cancelado || vencido ? (
          <>
            <h1 className="h2-grande">{vencido ? "O prazo para pagar acabou" : "Pagamento cancelado"}</h1>
            <p className="texto-mut">Volte ao WhatsApp e peça de novo.</p>
          </>
        ) : (
          <>
            <h1 className="h2-grande" style={{ marginBottom: 4 }}>{brl(doc.valor_centavos)}</h1>
            <p className="texto-mut" style={{ marginTop: 0 }}>Corrida com preço fechado · cartão de crédito</p>
            <div style={{ background: "#FFF4D6", color: "#8A5A00", borderRadius: 12, padding: "12px 16px", margin: "16px 0", fontSize: 14 }}>
              <b>Ambiente de teste:</b> nenhum dado de cartão é pedido aqui. O pagamento é aprovado automaticamente em instantes.
              Na versão real, esta página é o checkout seguro do provedor de pagamento.
            </div>
            {restante > 0 && <p className="texto-mut" style={{ fontSize: 14 }}>Prazo para pagar: {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")} · a confirmação aparece aqui sozinha.</p>}
          </>
        )}
      </div>
    </section>
  );
}
