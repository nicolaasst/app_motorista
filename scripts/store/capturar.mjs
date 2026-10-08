// Capturas de tela REAIS do app rodando (Chromium headless) nos tamanhos exigidos pelas lojas.
// Uso: node scripts/store/capturar.mjs [url-base]
//  * Sem credenciais: captura as telas públicas (entrar, recuperar senha).
//  * Com CAPTURA_IDENTIFICADOR e CAPTURA_SENHA (conta de revisor/teste do ambiente apontado): entra e captura também as telas logadas.
// Pré-requisito: app servindo em url-base (padrão http://127.0.0.1:4173 = `npm run preview`) e playwright disponível (`npm i -D playwright-core`).
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://127.0.0.1:4173";
const SAIDA = "docs/store/capturas";
// [nome, largura CSS, altura CSS, escala] → pixels = CSS × escala
const TAMANHOS = [
  ["android-1080x1920", 360, 640, 3],
  ["iphone-6.9-1320x2868", 440, 956, 3],
  ["iphone-6.5-1284x2778", 428, 926, 3],
];
const PUBLICAS = [
  ["01-entrar", "/login"],
  ["02-recuperar-senha", "/forgot"],
];
const LOGADAS = [
  ["03-inicio", "/"],
  ["04-historico", "/history"],
  ["05-recibos", "/receipts"],
  ["06-perfil", "/profile"],
  ["07-suporte", "/support"],
];

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
await mkdir(SAIDA, { recursive: true });
const logado = Boolean(process.env.CAPTURA_IDENTIFICADOR && process.env.CAPTURA_SENHA);

for (const [rotulo, largura, altura, escala] of TAMANHOS) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: escala, locale: "pt-BR", isMobile: true, hasTouch: true });
  const pagina = await ctx.newPage();
  for (const [nome, caminho] of PUBLICAS) {
    await pagina.goto(`${BASE}${caminho}`, { waitUntil: "networkidle" });
    await pagina.screenshot({ path: `${SAIDA}/${nome}-${rotulo}.png` });
  }
  if (logado) {
    await pagina.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await pagina.getByLabel(/CPF|matr[ií]cula/i).fill(process.env.CAPTURA_IDENTIFICADOR);
    await pagina.getByLabel(/senha/i).first().fill(process.env.CAPTURA_SENHA);
    await pagina.getByRole("button", { name: /entrar/i }).click();
    await pagina.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
    for (const [nome, caminho] of LOGADAS) {
      await pagina.goto(`${BASE}${caminho}`, { waitUntil: "networkidle" });
      await pagina.screenshot({ path: `${SAIDA}/${nome}-${rotulo}.png` });
    }
  }
  await ctx.close();
}
await navegador.close();
console.log(logado ? "capturas públicas e logadas geradas" : "capturas públicas geradas (defina CAPTURA_IDENTIFICADOR/CAPTURA_SENHA para as telas logadas)");
