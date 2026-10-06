"use client";

// Formulários do site em janela (modal): pré-cadastro do motorista parceiro,
// ViaMob Empresas e Contato. Gravam em `leads_site` (painel → Site público →
// Interessados) com o aceite de LGPD. Abrem de qualquer botão via
// useFormularios().abrir(tipo).
import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";
import { X } from "lucide-react";
import { ASSUNTOS_CONTATO, LEAD_VAZIO, enviarLead, validarLead, type DadosLead, type TipoFormulario } from "@/lib/leads";
import { mascarar } from "@/lib/compartilhado/validacoes";
import { useCidades } from "@/components/public/AoVivo";

type Estado = { abrir: (tipo: TipoFormulario) => void };
const Contexto = createContext<Estado | null>(null);
export const useFormularios = () => {
  const e = useContext(Contexto);
  if (!e) throw new Error("useFormularios fora do FormulariosProvider");
  return e;
};

const TITULOS: Record<TipoFormulario, { titulo: string; sub: string }> = {
  motorista: { titulo: "Quero ser Motorista Parceiro", sub: "Faça o pré-cadastro. A equipe entra em contato com os requisitos do seu município; o cadastro completo é feito no app." },
  empresa: { titulo: "ViaMob Empresas", sub: "Conta corporativa com centros de custo, regras de uso, colaboradores e faturamento consolidado." },
  contato: { titulo: "Fale com a gente", sub: "Dúvidas, sugestões, imprensa ou prefeituras. Para atendimento imediato, use o Chat com a Central." },
};

export function FormulariosProvider({ children }: { children: React.ReactNode }) {
  const [tipo, setTipo] = useState<TipoFormulario | null>(null);
  const abrir = useCallback((t: TipoFormulario) => setTipo(t), []);
  return (
    <Contexto.Provider value={{ abrir }}>
      {children}
      {tipo && <JanelaFormulario tipo={tipo} fechar={() => setTipo(null)} />}
    </Contexto.Provider>
  );
}

function JanelaFormulario({ tipo, fechar }: { tipo: TipoFormulario; fechar: () => void }) {
  const { cidade } = useCidades();
  const [d, setD] = useState<DadosLead>({ ...LEAD_VAZIO, municipio: cidade?.nome ?? "", uf: cidade?.uf ?? "", assunto: tipo === "contato" ? ASSUNTOS_CONTATO[0] : "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [falha, setFalha] = useState("");
  const t = TITULOS[tipo];
  const muda = (campo: keyof DadosLead, valor: any) => setD((x) => ({ ...x, [campo]: valor }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problemas = validarLead(tipo, d);
    setErros(problemas);
    if (Object.keys(problemas).length) return;
    setEnviando(true); setFalha("");
    try { setProtocolo(await enviarLead(tipo, d)); }
    catch { setFalha("Não foi possível enviar agora. Tente de novo em instantes."); }
    finally { setEnviando(false); }
  };

  const campo = (nome: keyof DadosLead, rotulo: string, extra: { tipo?: string; mascara?: "cpf" | "cnpj" | "telefone" | "uf"; obrigatorio?: boolean; placeholder?: string; largo?: boolean } = {}) => (
    <label className={`campo${extra.largo ? " largo" : ""}`}>
      <span>{rotulo}{extra.obrigatorio ? " *" : ""}</span>
      <input type={extra.tipo ?? "text"} value={String(d[nome] ?? "")} placeholder={extra.placeholder}
        onChange={(e) => muda(nome, extra.mascara ? mascarar(extra.mascara, e.target.value) : e.target.value)}
        aria-invalid={!!erros[nome]} />
      {erros[nome] && <em>{erros[nome]}</em>}
    </label>
  );

  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal modal-form" role="dialog" aria-modal="true" aria-labelledby="titulo-form" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fechar" onClick={fechar} aria-label="Fechar"><X size={20} /></button>
        {protocolo ? (
          <div className="form-ok">
            <div className="dot grande">✓</div>
            <h2>Recebemos o seu contato!</h2>
            <p>Número do registro: <b>{protocolo}</b>. A equipe ViaMob360 vai falar com você em breve.</p>
            <button type="button" className="btn btn-primary" onClick={fechar}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={enviar} noValidate>
            <div className="eyebrow">ViaMob360</div>
            <h2 id="titulo-form">{t.titulo}</h2>
            <p className="sub-form">{t.sub}</p>
            <div className="grade-form">
              {campo("nome", tipo === "empresa" ? "Responsável" : "Nome completo", { obrigatorio: true, largo: true })}
              {tipo === "motorista" && campo("cpf", "CPF", { mascara: "cpf", obrigatorio: true })}
              {tipo === "empresa" && campo("razao_social", "Razão social", { obrigatorio: true, largo: true })}
              {tipo === "empresa" && campo("cnpj", "CNPJ", { mascara: "cnpj" })}
              {campo("telefone", "Celular", { mascara: "telefone", placeholder: "(92) 99999-9999" })}
              {campo("email", "E-mail", { tipo: "email", largo: tipo !== "motorista" })}
              {campo("municipio", "Município", { obrigatorio: tipo === "motorista" })}
              {campo("uf", "UF", { mascara: "uf", placeholder: "AM" })}
              {tipo === "motorista" && campo("veiculo", "Veículo (modelo e ano)", { largo: true, placeholder: "Ex.: Onix 2021" })}
              {tipo === "empresa" && campo("colaboradores_estimados", "Colaboradores (estimativa)", { tipo: "number" })}
              {tipo === "contato" && (
                <label className="campo largo">
                  <span>Assunto</span>
                  <select value={d.assunto} onChange={(e) => muda("assunto", e.target.value)}>
                    {ASSUNTOS_CONTATO.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </label>
              )}
              <label className="campo largo">
                <span>Mensagem{tipo === "contato" ? " *" : ""}</span>
                <textarea rows={3} value={d.mensagem} onChange={(e) => muda("mensagem", e.target.value)} aria-invalid={!!erros.mensagem} />
                {erros.mensagem && <em>{erros.mensagem}</em>}
              </label>
              <label className="aceite largo">
                <input type="checkbox" checked={d.aceite} onChange={(e) => muda("aceite", e.target.checked)} />
                <span>Concordo com a <Link href="/paginas/politica-de-privacidade" target="_blank">Política de Privacidade</Link> e autorizo o contato da equipe ViaMob360.</span>
              </label>
              {erros.aceite && <em className="largo erro-aceite">{erros.aceite}</em>}
            </div>
            {falha && <div className="chat-erro" role="alert">{falha}</div>}
            <div className="acoes-form">
              <button type="button" className="btn btn-outline" onClick={fechar}>Cancelar</button>
              <button type="submit" className={`btn ${tipo === "motorista" ? "btn-green" : "btn-primary"}`} disabled={enviando}>{enviando ? "Enviando..." : "Enviar"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
