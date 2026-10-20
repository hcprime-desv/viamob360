// ═══ GERADO a partir do painel ViaMob360 — NÃO EDITAR AQUI. ═══
// Altere no painel e rode `npm run sync:app` lá.

// Tipos das escritas que os planejadores devolvem (o painel grava por
// shared/function/aplicarEscritas.ts; o app, pela fila offline). Só tipos —
// sem Firebase — para os planejadores continuarem puros e testáveis.
// Mesmo molde do PetGo, sem o ajuste de horário e com `incrementar`.

// "$ref:<nome>" em `id` ou em qualquer valor de `dados` = id de um documento
// criado antes no mesmo plano (a escrita "criar" com `ref: "<nome>"`).
export type Escrita =
  | { tipo: "atualizar"; colecao: string; id: string; dados: Record<string, any> }
  | { tipo: "criar"; colecao: string; dados: Record<string, any>; ref?: string }
  // Soma atômica (saldos de carteira e voucher): não perde atualização
  // simultânea do app e do painel. Valores em centavos, podem ser negativos.
  | { tipo: "incrementar"; colecao: string; id: string; campos: Record<string, number> };

export type Plano = { escritas: Escrita[]; descricao: string };

// Problema de validação apontado por uma regra compartilhada (o painel vira
// erro do campo no formulário; o app mostra a mensagem).
export type Problema = { campo: string; mensagem: string };
