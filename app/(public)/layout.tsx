import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import AvisosClient from "@/components/public/AvisosClient";
import { AoVivoProvider } from "@/components/public/AoVivo";
import { ChatFlutuante, ChatProvider } from "@/components/chat/ChatCentral";
import { FormulariosProvider } from "@/components/forms/Formularios";
import { listarAvisosAtivos, listarCidades, listarConfiguracao, listarPaginasPublicadas, listarPerguntas } from "@/lib/data";

// Sem cache: o servidor Node renderiza cada acesso com o dado atual do
// Firestore e, no navegador, tudo segue em tempo real (AoVivoProvider,
// AvisosClient). O Chat com a Central fica disponível em todas as páginas.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [configuracao, paginas, perguntas, avisos, cidades] = await Promise.all([
    listarConfiguracao(), listarPaginasPublicadas(), listarPerguntas(), listarAvisosAtivos(), listarCidades(),
  ]);
  return (
    <AoVivoProvider configuracao={configuracao} paginas={paginas} perguntas={perguntas} cidades={cidades}>
      <ChatProvider>
        <FormulariosProvider>
          <div className="topo-fixo">
            <AvisosClient avisosIniciais={avisos} />
            <Header />
          </div>
          <main id="conteudo">{children}</main>
          <Footer />
          <ChatFlutuante />
        </FormulariosProvider>
      </ChatProvider>
    </AoVivoProvider>
  );
}
