// Utilitários do site ViaMob360.

export const ehExterno = (href: string) => /^https?:\/\//.test(href);

// Rola até uma seção da Home (âncora) — funciona também vindo de outra página.
export const linkSecao = (id: string) => `/#${id}`;
