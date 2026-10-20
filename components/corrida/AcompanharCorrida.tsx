"use client";

import { useEffect, useMemo, useState } from "react";
import { getDocOn, filtrarOn } from "@/lib/firebase/gen";

// Acompanhamento público (link enviado pelo WhatsApp). Tempo real: a corrida
// pelo `token_acompanhamento`; antes do aceite, o pedido. Posição do carro só
// com a corrida ativa — depois de finalizar ou cancelar, some (LGPD).
const ROTULOS: Record<string, string> = {
  aguardando_pagamento: "Aguardando o pagamento do Pix",
  buscando: "Procurando um motorista perto de você…",
  expirada: "Nenhum motorista aceitou — o pedido expirou",
  cancelada: "Corrida cancelada",
  aceita: "Motorista a caminho",
  motorista_a_caminho: "Motorista a caminho",
  motorista_chegou: "O motorista chegou",
  aguardando_pin: "Embarque — informe o PIN ao motorista",
  em_andamento: "Em viagem",
  pausada_local: "Parada rápida",
  finalizada: "Corrida finalizada",
};
const ATIVAS = ["aceita", "motorista_a_caminho", "motorista_chegou", "aguardando_pin", "em_andamento", "pausada_local"];
const ms = (v: any) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() : 0);

export default function AcompanharCorrida({ token }: { token: string }) {
  const [corrida, setCorrida] = useState<any | null | undefined>(undefined);
  const [pedido, setPedido] = useState<any | null | undefined>(undefined);
  const [veiculo, setVeiculo] = useState<any | null>(null);
  const [motorista, setMotorista] = useState<any | null>(null);
  const [posicoes, setPosicoes] = useState<any[]>([]);
  const [mapaEm, setMapaEm] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!token) return;
    const a = filtrarOn("corridas", "token_acompanhamento", token, (d) => setCorrida(d[0] ?? null));
    const b = filtrarOn("solicitacoes_corridas", "token_acompanhamento", token, (d) => setPedido(d[0] ?? null));
    return () => { a(); b(); };
  }, [token]);
  const ativa = !!corrida && ATIVAS.includes(corrida.status);
  useEffect(() => {
    if (!corrida?.id_veiculos) return;
    return getDocOn("veiculos", String(corrida.id_veiculos), setVeiculo);
  }, [corrida?.id_veiculos]);
  useEffect(() => {
    if (!corrida?.id_motoristas) return;
    return getDocOn("motoristas", String(corrida.id_motoristas), setMotorista);
  }, [corrida?.id_motoristas]);
  useEffect(() => {
    if (!ativa || !corrida?.id_motoristas) { setPosicoes([]); return; }
    return filtrarOn("localizacoes_motoristas", "id_motoristas", String(corrida.id_motoristas), setPosicoes);
  }, [ativa, corrida?.id_motoristas]);
  // Última posição do motorista (pode haver mais de um documento por motorista).
  const pos = useMemo(() => {
    const p = [...posicoes].filter((x) => Number.isFinite(x.latitude)).sort((a, b) => ms(b.updated_at) - ms(a.updated_at))[0];
    return p ? { lat: Number(p.latitude), lng: Number(p.longitude) } : null;
  }, [posicoes]);
  // O mapa embutido recarrega no máximo a cada 15 s (evita piscar a cada GPS).
  useEffect(() => {
    if (!pos) { setMapaEm(null); return; }
    setMapaEm((atual) => atual ?? pos);
    const t = setInterval(() => setMapaEm(pos), 15000);
    return () => clearInterval(t);
  }, [pos?.lat, pos?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregando = corrida === undefined || pedido === undefined;
  const status = corrida?.status ?? pedido?.status ?? null;
  const nome = String(motorista?.nome ?? "").split(" ")[0];
  const d = 0.008;
  const osm = mapaEm ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapaEm.lng - d}%2C${mapaEm.lat - d}%2C${mapaEm.lng + d}%2C${mapaEm.lat + d}&layer=mapnik&marker=${mapaEm.lat}%2C${mapaEm.lng}` : null;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="eyebrow">Acompanhar corrida</div>
        {carregando ? (
          <p className="texto-mut">Carregando…</p>
        ) : !status ? (
          <>
            <h1 className="h2-grande">Corrida não encontrada</h1>
            <p className="texto-mut">O link pode estar incompleto ou a corrida já foi encerrada há muito tempo.</p>
          </>
        ) : (
          <>
            <h1 className="h2-grande" style={{ marginBottom: 8 }}>{ROTULOS[status] ?? status}</h1>
            {corrida?.codigo && <p className="texto-mut" style={{ marginTop: 0 }}>Corrida {corrida.codigo}</p>}
            {corrida && (
              <div style={{ border: "1px solid var(--borda, #e2e8f0)", borderRadius: 16, padding: 16, display: "grid", gap: 6, margin: "16px 0" }}>
                {nome && <div>Motorista: <b>{nome}</b></div>}
                {veiculo && <div>Carro: <b>{[veiculo.marca, veiculo.modelo, veiculo.cor].filter(Boolean).join(" ")}</b> · placa <b>{String(veiculo.placa ?? "").toUpperCase()}</b></div>}
                {corrida.destino?.endereco && <div>Destino: {corrida.destino.endereco}</div>}
                {ativa && <div className="texto-mut" style={{ fontSize: 14 }}>Confira a placa antes de entrar. Em caso de emergência, envie SOS no WhatsApp ou ligue 190.</div>}
              </div>
            )}
            {ativa && osm ? (
              <>
                <iframe title="Posição do carro" src={osm} style={{ width: "100%", height: 380, border: 0, borderRadius: 16 }} loading="lazy" />
                {pos && (
                  <p style={{ marginTop: 8 }}>
                    <a className="btn btn-outline" href={`https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`} target="_blank" rel="noreferrer">Abrir no Google Maps</a>
                  </p>
                )}
                <p className="texto-mut" style={{ fontSize: 13 }}>A posição atualiza sozinha.</p>
              </>
            ) : ativa ? <p className="texto-mut">Aguardando a posição do motorista…</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
