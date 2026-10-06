/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Tenant do site (dados/{path}) = `PORTAL_PATH` do .env. Repassado aqui
  // porque variável sem NEXT_PUBLIC_ não chega ao navegador (chat e dados ao
  // vivo rodam lá). Nomes de variáveis SEM o nome do projeto (decisão do
  // dono). Lido em lib/firebase/gen.ts. Mudou o valor: reinicie o
  // `npm run dev` (ou refaça o build — o valor é embutido no build).
  env: {
    PORTAL_PATH: process.env.PORTAL_PATH || "",
  },
};

module.exports = nextConfig;
