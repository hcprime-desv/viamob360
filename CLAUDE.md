# ViaMob360 — site público

Site institucional/comercial da plataforma ViaMob360 (Next.js 15, App
Router, TypeScript): porta de entrada para passageiros, motoristas
parceiros e empresas, com o **Chat com a Central** em todas as páginas.
Especificação em `documentacao/`: `ViaMob360_Documentacao_Projeto_Site.pdf`,
`ViaMob360_Wireframe_Site.html` (estrutura, textos e o modelo do chat) e
`site_principal.png` (**referência visual** — conferir o layout contra ela
depois de mexer na Home; captura com o Chrome headless, largura 1672).

**Este repositório é só o site — não tem painel.** O conteúdo vem do painel
ViaMob360 (`D:\desv\producao\hc\projetos\ViaMob360`), grupo **ViaMob360 →
Site público** (Configuração do site, Páginas, Perguntas frequentes,
Avisos, Interessados), e o chat cai na fila do **OmniChannel** de lá. Os
schemas do painel (`shared/shemas/viamob360/*Site*Shema.ts`,
`PerguntaFrequenteShema.ts`, `LeadSiteShema.ts`) são a fonte da verdade;
`types/conteudo.ts` e `lib/data.ts` só espelham o que o site usa.

Nasceu da base do site do PetHub360 (que veio do portal181); tudo de pet foi
removido e o `.git` copiado do PetGo foi apagado (repositório novo, sem
remote — o dono cria no GitHub). Roda local: `npm run dev`, ou
`npm run build && npx next start` para testar como produção.

## Decisões (e o porquê)

- **Sem área de prefeitura** (decisão do dono, 06/10/2026): tudo da
  prefeitura é feito no painel. Prefeitura interessada usa o Contato
  (assunto "Prefeitura / órgão público"). No lugar do bloco "Para
  prefeituras" da imagem fica o do motorista parceiro.
- **Página única com âncoras**, como o wireframe: `#inicio`,
  `#como-funciona`, `#passageiros`, `#motoristas`, `#empresas`,
  `#beneficios`, `#seguranca`, `#cidades`, `#ajuda`, `#baixar`. Institucionais
  em `/paginas/[slug]` (Markdown sanitizado — `components/public/Markdown.tsx`).
- **Chat com a Central REAL** (`lib/chat.ts`, `components/chat/ChatCentral.tsx`):
  saudação → botões de assunto → **pede o nome** → grava contato
  (`contatos_omnichannel`, id `site_<token do navegador>`), chat (`chats`,
  id = protocolo `SITE-AAAAMMDD-XXXXX`, fila da central `puc_site`/`puc_app`
  dos Parâmetros) e mensagens (`messages`); o agente responde pelo Chat do
  painel e aparece aqui em tempo real. Assunto de segurança/emergência =
  prioridade alta. Sessão no localStorage (recarregar mantém a conversa).
  Painel embutido na Home + janela flutuante = a MESMA conversa.
- **Regras compartilhadas geradas pelo painel**: `lib/compartilhado/`
  (`dados`, `omnichannel`, `site`, `validacoes`) — NÃO editar aqui; mudar no
  painel e rodar `npm run sync:app` lá.
- **Formulários em janela** (`components/forms/Formularios.tsx`):
  motorista parceiro (pré-cadastro), empresa e contato → `leads_site` com
  aceite de LGPD obrigatório e id sequencial (`criarComIdSequencial`, igual
  ao `onSaveIncrement` do painel). Validação com o mesmo `validarCampo`.
- **Tempo real em tudo, sem cache** (padrão portal181): `force-dynamic` no
  layout; no navegador o `AoVivoProvider` mantém configuração, páginas e
  perguntas com onSnapshot. Não usar `revalidate`/ISR.
- **Multi-cidade**: cidades = clientes `VIAMOB360` da coleção raiz `cliente`
  + `municipios` de cada tenant; se a raiz não puder ser lida (regras), só o
  município do tenant do site. A cidade escolhida (selo no topo) muda a
  frase do banner e as categorias mostradas (`categorias_servico` daquele
  município).
- **Mesmo Firebase do painel**, tenant em `PORTAL_PATH` (.env), repassado
  pelo `next.config.js` para servidor e navegador (sem padrão; hoje
  `MOVECIDADE`, o tenant de teste). Variáveis de ambiente SEM o nome do
  projeto (decisão do dono). Acesso só por
  `lib/firebase/gen.ts`. Coleções do OmniChannel gravadas SEM carimbo de
  data (`created_at` em ms, como o Core).
- **Só dado público.** Nunca ler passageiros, motoristas, corridas ou
  pagamentos aqui.
- **Visual**: CSS próprio em `app/globals.css` (variáveis do wireframe:
  `--blue`, `--green`... sobrescritas pelas cores da Configuração do site),
  sem Tailwind (o reset mudaria o desenho). Títulos em Poppins, texto em Inter.
  Imagens em `public/images/` (banner cidade + app gerado de
  `documentacao/ViaMob360_banner.png`; logos do painel).

## Pendências

- Firestore rules: herdadas do portal181 (`dados/**` aberto, sem Firebase
  Auth) — o site grava chats/mensagens/contatos/leads com elas. Revisar.
- Anexo e localização no chat (previstos na doc, item 10.1).
- Analytics com consentimento (doc, item 15).
