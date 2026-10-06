import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { markdownSanitizeSchema } from "@/lib/markdownSanitize";

// Todo Markdown do site (páginas e avisos, editados no painel com
// CampoMarkdown) passa por aqui: HTML embutido é aceito (rehype-raw), mas
// sempre sanitizado — script/iframe/on* são removidos.
export default function Markdown({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
      components={inline ? { p: ({ children: c }) => <span>{c}</span> } : undefined}
    >
      {children}
    </ReactMarkdown>
  );
}
