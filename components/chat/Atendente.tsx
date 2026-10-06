// Desenho da atendente da Central (headset com microfone) — SVG próprio, sem
// imagem externa: nítido em qualquer tamanho. Usado na bola do chat, no
// avatar das mensagens da Central e no cabeçalho do chat embutido.
import { useId } from "react";

export default function Atendente({ tamanho = 40, titulo }: { tamanho?: number; titulo?: string }) {
  const clip = `atendente-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`; // id único por desenho
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" role={titulo ? "img" : undefined} aria-hidden={titulo ? undefined : true} aria-label={titulo}>
      <defs>
        <clipPath id={clip}><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <circle cx="32" cy="32" r="32" fill="#e8f2ff" />
        {/* cabelo (atrás) */}
        <path d="M14 34c0-13 8-22 18-22s18 9 18 22v14H14z" fill="#3b2418" />
        {/* ombros / camisa */}
        <path d="M8 66c1-12 11-18 24-18s23 6 24 18z" fill="#075fd7" />
        <path d="M26 48l6 7 6-7" fill="#ffffff" />
        {/* pescoço */}
        <rect x="27.5" y="40" width="9" height="9" rx="3" fill="#e9b08a" />
        {/* rosto */}
        <ellipse cx="32" cy="31" rx="11" ry="12.5" fill="#f4c39e" />
        {/* franja */}
        <path d="M20.5 28c2-9 8-12.5 13-12.5 6 0 10 3.5 11 10-5-1-10-3.5-12.5-7-2.5 4.5-6.5 8-11.5 9.5z" fill="#3b2418" />
        {/* olhos e sorriso */}
        <circle cx="27.5" cy="31.5" r="1.4" fill="#10213f" />
        <circle cx="36.5" cy="31.5" r="1.4" fill="#10213f" />
        <path d="M28.5 36.5c2 2 5 2 7 0" stroke="#b9534a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* headset */}
        <path d="M18.5 31c0-9 6-15.5 13.5-15.5S45.5 22 45.5 31" stroke="#10213f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <rect x="16" y="28" width="5.5" height="9" rx="2.5" fill="#10213f" />
        <rect x="42.5" y="28" width="5.5" height="9" rx="2.5" fill="#10213f" />
        <path d="M20 36c1 5 4.5 7.5 9 7.5" stroke="#10213f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="43.5" r="2" fill="#07a958" />
      </g>
    </svg>
  );
}
