"use client";

// "Como você ganha" — o modelo comercial da CIDADE ESCOLHIDA no topo do site,
// para o motorista parceiro: plano (percentual, assinatura ou assinatura com
// franquia), como recebe as corridas, carteira e conta digital, e o mini banco
// (em breve). Tudo vem de operacoes.remuneracao pela regra única
// regrasComerciais (lib/compartilhado/remuneracao.ts) — mudou no painel, muda aqui.
import { ArrowRight, BadgePercent, Banknote, CalendarCheck, Landmark, Layers, Sparkles, Wallet } from "lucide-react";
import { useCidades } from "@/components/public/AoVivo";
import { useFormularios } from "@/components/forms/Formularios";
import { configRemuneracao, detalhePlano, planosHabilitados, regrasComerciais } from "@/lib/compartilhado/remuneracao";

const brl = (c: number) => (Number(c) / 100 || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function usePlanoDaCidade() {
  const { cidade } = useCidades();
  const cfg = configRemuneracao({ remuneracao: cidade?.remuneracao ?? {} });
  const regras = regrasComerciais(cfg);
  const valores = [cfg.valorMensalCentavos, ...Object.values(cfg.valoresPorCategoria)].filter((v) => v > 0);
  const aPartirDe = valores.length ? Math.min(...valores) : cfg.valorMensalCentavos;
  // planos que o motorista escolhe no app (mensal, semanal = passe de 7 dias, diário = passe de 24 h)
  const planos = planosHabilitados(cfg).map((p) => ({ ...detalhePlano(cfg, p, null), valorCentavos: p === "mensal" ? aPartirDe : detalhePlano(cfg, p).valorCentavos }));
  return { cidade, cfg, regras, aPartirDe, planos, porCategoria: Object.keys(cfg.valoresPorCategoria).length > 0, banco: !!cidade?.bancoMotorista };
}
const SUFIXO = { mensal: "/mês", semanal: "/semana", diario: "/dia" } as const;
const NOME = { mensal: "Mensal", semanal: "Semanal", diario: "Diário" } as const;
/** "Mensal R$ 99/mês · Semanal R$ 35/semana · Diário R$ 8/dia" */
export const textoPlanos = (planos: ReturnType<typeof usePlanoDaCidade>["planos"], porCategoria = false) =>
  planos.map((p) => `${NOME[p.plano]} ${p.plano === "mensal" && porCategoria ? "a partir de " : ""}${brl(p.valorCentavos)}${SUFIXO[p.plano]}${p.corridas ? ` (${p.corridas} corridas)` : ""}`).join(" · ");

// Frases do bloco "Para motoristas parceiros" conforme a cidade.
export function textosMotorista(p: ReturnType<typeof usePlanoDaCidade>) {
  const { regras, cfg, aPartirDe, banco, planos } = p;
  const resumo = regras.modelo === "percentual"
    ? "Sem mensalidade: a plataforma fica com um percentual de cada corrida — e você vê quanto vai receber antes de aceitar."
    : planos.length > 1
      ? `Assinatura do seu jeito — ${textoPlanos(planos)} — e 100% do valor de cada corrida é seu.`
      : regras.franquia
      ? `Mensalidade de ${brl(aPartirDe)} com ${cfg.franquiaCorridas} corridas incluídas no mês — e 100% do valor de cada corrida é seu.`
      : `Mensalidade fixa de ${brl(aPartirDe)} — e 100% do valor de cada corrida é seu.`;
  const checks = [
    "Pré-cadastro, análise e ativação pelo app.",
    regras.recebedor === "motorista" ? "Receba direto do passageiro: dinheiro, Pix ou maquininha." : "O passageiro paga antes: corrida garantida, sem calote.",
    regras.recebedor === "motorista" ? "Ofertas com valor, distância e forma de pagamento antes de aceitar." : "Carteira no app e transferência grátis por Pix para a sua conta.",
    banco ? "Conta digital no app, opcional e sem custo." : "Suporte dedicado na Central 24h.",
  ];
  return { resumo, checks };
}

export default function PlanosMotorista() {
  const plano = usePlanoDaCidade();
  const { cidade, cfg, regras, aPartirDe, porCategoria, banco, planos } = plano;
  const formularios = useFormularios();
  const nomeCidade = cidade?.nome ?? "sua cidade";

  const extra = regras.franquia ? ` Acabaram as corridas incluídas? Compre um pacote extra de ${cfg.pacoteExtraCorridas} corridas por ${brl(cfg.pacoteExtraCentavos)} direto no app.` : "";
  const planoCard = regras.modelo === "percentual"
    ? { icone: BadgePercent, titulo: "Percentual por corrida", destaque: "Sem mensalidade", texto: "A plataforma fica com um percentual de cada corrida. O valor que você vai receber aparece na oferta, antes de aceitar." }
    : planos.length > 1
      ? { icone: CalendarCheck, titulo: regras.franquia ? "Assinatura + franquia, do seu jeito" : "Assinatura do seu jeito", destaque: textoPlanos(planos, porCategoria), texto: `Escolha no app: mensal, ou passe semanal (7 dias) e diário (24 horas) pagos antes, para quem roda só alguns dias. 100% do valor das corridas é seu.${extra}` }
      : regras.franquia
      ? { icone: Layers, titulo: "Assinatura + franquia", destaque: `${porCategoria ? "a partir de " : ""}${brl(aPartirDe)}/mês`, texto: `Inclui ${cfg.franquiaCorridas} corridas no mês. Acabou antes da renovação? Compre um pacote extra de ${cfg.pacoteExtraCorridas} corridas por ${brl(cfg.pacoteExtraCentavos)} direto no app.` }
      : { icone: CalendarCheck, titulo: "Assinatura mensal", destaque: `${porCategoria ? "a partir de " : ""}${brl(aPartirDe)}/mês`, texto: "Valor fixo por mês e 100% do valor das corridas é seu — sem percentual por viagem." };
  const recebeCard = regras.recebedor === "motorista"
    ? { icone: Banknote, titulo: "Receba direto do passageiro", texto: "Dinheiro, Pix ou maquininha — a forma de pagamento aparece na oferta para você aceitar ou não. Sem taxa por corrida." }
    : { icone: Wallet, titulo: "Corrida paga antes", texto: `O passageiro paga pelo app ou pelo WhatsApp antes de você sair. O valor cai na sua carteira${regras.assinatura ? " inteiro (menos a taxa do Pix ou do cartão)" : ""} e você transfere quando quiser, de graça, por Pix.` };
  const PlanoIcone = planoCard.icone;
  const RecebeIcone = recebeCard.icone;

  return (
    <section className="section soft" id="planos">
      <div className="container">
        <div className="section-head">
          <div><div className="eyebrow">Motorista parceiro</div><h2>Como você ganha em {nomeCidade}.</h2></div>
          <p>Cada cidade define o seu modelo. Escolha a cidade no topo do site para ver as condições dela.</p>
        </div>
        <div className="grid-planos">
          <div className="card grande">
            <span className="icon-circ verde"><PlanoIcone size={24} /></span>
            <h3>{planoCard.titulo}</h3>
            <div className="plano-destaque">{planoCard.destaque}</div>
            <p>{planoCard.texto}</p>
          </div>
          <div className="card grande">
            <span className="icon-circ azul"><RecebeIcone size={24} /></span>
            <h3>{recebeCard.titulo}</h3>
            <p>{recebeCard.texto}</p>
          </div>
          <div className="card grande">
            <span className="icon-circ laranja"><Landmark size={24} /></span>
            <h3>Carteira{banco ? " e conta digital" : ""}</h3>
            <p>Ganhos e extrato no app. Transfira o saldo para a sua conta por Pix, sem tarifa (a partir de R$ 20).{banco ? " E, se quiser, abra a sua conta digital no próprio app: a transferência cai na hora." : ""}</p>
          </div>
        </div>
        <div className="card grande mini-banco">
          <div>
            <span className="tag">Em breve</span>
            <h3><Sparkles size={20} aria-hidden /> O banco do motorista, dentro do app</h3>
            <p>Pix, pagamento de contas, cartão, cobrança por link para corridas particulares e crédito pelo seu histórico de corridas — sem comprovante de renda e só com a sua autorização.</p>
          </div>
          <button type="button" className="btn btn-green" onClick={() => formularios.abrir("motorista")}>Quero ser parceiro <ArrowRight size={18} /></button>
        </div>
      </div>
    </section>
  );
}
