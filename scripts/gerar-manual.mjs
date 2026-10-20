// Gera o PDF do manual do site (documentacao/manual/manual-site.html →
// documentacao/Manual_ViaMob360_Site.pdf) com o Chrome/Edge em modo headless
// (impressão A4 do estilo.css — o mesmo dos manuais do painel).
// Uso: npm run docs:manual
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEM = path.join(RAIZ, "documentacao", "manual", "manual-site.html");
const DESTINO = path.join(RAIZ, "documentacao", "Manual_ViaMob360_Site.pdf");
const NAVEGADORES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const navegador = NAVEGADORES.find((p) => existsSync(p));
if (!navegador) throw new Error("Chrome/Edge não encontrado. Defina CHROME_PATH.");
execFileSync(navegador, [
  "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
  `--print-to-pdf=${DESTINO}`, pathToFileURL(ORIGEM).href,
], { stdio: "ignore" });
console.log(`ok documentacao/Manual_ViaMob360_Site.pdf (${Math.round(statSync(DESTINO).size / 1024)} KB)`);
