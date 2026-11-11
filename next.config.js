/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tipos conferidos no `pnpm typecheck` da raiz (tsconfig.typecheck.json): o next build dos sites React 19 acusa erro FALSO
  // pelo @types/react 18 içado dos painéis (mesma solução do portal181 — CLAUDE.md).
  typescript: { ignoreBuildErrors: true },
  // SSR de verdade num servidor Node.js (`node server.js` a partir de
  // `.next/standalone`): cada acesso renderiza com o dado atual do Firestore
  // (SEO) e, no navegador, tudo segue em tempo real (onSnapshot — ver
  // lib/data.ts, par listarX/subscribeX).
  output: "standalone",
  reactStrictMode: true,
  // Sem isso, o Next detecta um lockfile solto num diretório acima (fora
  // deste projeto, ex: outro repo no mesmo D:\) e assume ELE como raiz do
  // "monorepo" — o output de `output: "standalone"` sai aninhado num
  // caminho absoluto gigante em vez de `.next/standalone/` direto.
  outputFileTracingRoot: __dirname,
  // Banco do site = NEXT_PUBLIC_SITE_PATH (caminho completo; lib/firebase/gen.ts). `PORTAL_PATH` = nome antigo, reserva. Repassado aqui
  // porque variável sem NEXT_PUBLIC_ não chega ao navegador (chat e dados ao
  // vivo rodam lá). Nomes de variáveis SEM o nome do projeto (decisão do
  // dono). Lido em lib/firebase/gen.ts. Mudou o valor: reinicie o
  // `npm run dev` (ou refaça o build — o valor é embutido no build).
  env: {
    PORTAL_PATH: process.env.PORTAL_PATH || "",
  },
};

module.exports = nextConfig;
