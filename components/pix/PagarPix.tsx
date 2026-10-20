"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { filtrarOn } from "@/lib/firebase/gen";

// Pix em tempo real: mostra o QR e o copia-e-cola enquanto está pendente e
// "Pagamento confirmado" assim que o back-end/banco aprova.
const brl = (c: any) => (Number(c) / 100 || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ms = (v: any) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() : 0);
const DESCRICAO: Record<string, string> = { pedido: "Corrida (preço fechado)", corrida: "Corrida", pendencia: "Pendência (multa por não comparecimento)" };

export default function PagarPix({ token }: { token: string }) {
  const [pagamento, setPagamento] = useState<any | null | undefined>(undefined);
  const [mensalidade, setMensalidade] = useState<any | null | undefined>(undefined);
  const [copiado, setCopiado] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!token) return;
    const a = filtrarOn("pagamentos", "token_pix", token, (d) => setPagamento(d[0] ?? null));
    const b = filtrarOn("assinaturas_motoristas", "token_pix", token, (d) => setMensalidade(d[0] ?? null));
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => { a(); b(); clearInterval(t); };
  }, [token]);

  const doc = pagamento ?? mensalidade ?? null;
  const carregando = pagamento === undefined || mensalidade === undefined;
  const pago = doc && (doc.status === "aprovado" || doc.status === "paga");
  const expira = doc ? ms(doc.pix_expira_em) : 0;
  const vencido = !!doc && !pago && expira > 0 && expira < agora;
  const cancelado = !!doc && ["cancelado", "estornado", "recusado", "cancelada", "isenta"].includes(doc.status);
  const restante = expira > agora ? Math.ceil((expira - agora) / 1000) : 0;
  const descricao = mensalidade && !pagamento ? `Mensalidade ${mensalidade.competencia ?? ""}` : DESCRICAO[doc?.finalidade] ?? "Pagamento";
  const copiar = async () => {
    try { await navigator.clipboard.writeText(doc.copia_cola_pix); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { /* sem permissão: o texto está visível */ }
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520, textAlign: "center" }}>
        <div className="eyebrow">Pagar com Pix</div>
        {carregando ? <p className="texto-mut">Carregando…</p> : !doc ? (
          <>
            <h1 className="h2-grande">Pix não encontrado</h1>
            <p className="texto-mut">O link pode estar incompleto. Volte ao WhatsApp e peça um novo Pix.</p>
          </>
        ) : pago ? (
          <>
            <div style={{ fontSize: 56 }}>✅</div>
            <h1 className="h2-grande">Pagamento confirmado</h1>
            <p className="texto-mut">{descricao} · {brl(doc.valor_centavos)}. Você já pode voltar ao WhatsApp.</p>
          </>
        ) : cancelado || vencido ? (
          <>
            <h1 className="h2-grande">{vencido ? "Este Pix venceu" : "Pix cancelado"}</h1>
            <p className="texto-mut">Volte ao WhatsApp e peça de novo.</p>
          </>
        ) : (
          <>
            <h1 className="h2-grande" style={{ marginBottom: 4 }}>{brl(doc.valor_centavos)}</h1>
            <p className="texto-mut" style={{ marginTop: 0 }}>{descricao}</p>
            {doc.copia_cola_pix ? (
              <>
                <div style={{ display: "inline-block", background: "#fff", padding: 16, borderRadius: 16, margin: "12px 0" }}>
                  <QRCodeSVG value={doc.copia_cola_pix} size={240} />
                </div>
                <p><button type="button" className="btn btn-primary" onClick={copiar} style={{ minWidth: 220 }}>{copiado ? "Código copiado!" : "Copiar código Pix"}</button></p>
                <p className="texto-mut" style={{ fontSize: 13, wordBreak: "break-all" }}>{doc.copia_cola_pix}</p>
              </>
            ) : <p className="texto-mut">Gerando o código…</p>}
            {restante > 0 && <p className="texto-mut" style={{ fontSize: 14 }}>Válido por {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")} · a confirmação aparece aqui sozinha.</p>}
          </>
        )}
      </div>
    </section>
  );
}
