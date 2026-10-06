import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640, textAlign: "center" }}>
        <div className="eyebrow">Erro 404</div>
        <h1 className="h2-grande">Página não encontrada</h1>
        <p className="texto-mut" style={{ margin: "0 auto" }}>O endereço pode ter mudado ou o conteúdo não está mais publicado.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">Ir para o início</Link>
          <Link href="/#ajuda" className="btn btn-outline">Perguntas frequentes</Link>
        </div>
      </div>
    </section>
  );
}
