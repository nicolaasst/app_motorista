import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../tests/visual/baseline');
const baseUrl = process.env.BASELINE_BASE_URL || 'http://localhost:5173';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const screens = [
  { id: 'a.1_login_do_motorista', path: '/', requiresAuth: false },
  { id: 'a.2_esqueci_minha_senha_otp', path: '/recuperar', requiresAuth: false },
  { id: 'a.3_checklist_do_ve_culo', path: '/checklist', requiresAuth: true },
  { id: 'b.1_rota_do_dia_home', path: '/rota', requiresAuth: true },
  { id: 'b.2_detalhe_da_parada', path: '/rota/parada/stop-05', requiresAuth: true },
  { id: 'b.3_navega_o_at_a_parada', path: '/rota/parada/stop-05/navegar', requiresAuth: true },
  { id: 'b.4_confirmar_entrega', path: '/rota/parada/stop-05/entrega', requiresAuth: true },
  { id: 'b.5_registrar_falha', path: '/rota/parada/stop-05/falha', requiresAuth: true },
  { id: 'b.6_fim_de_rota', path: '/rota/fim', requiresAuth: true },
  { id: 'b.7_checklist_de_retorno', path: '/rota/retorno', requiresAuth: true },
  { id: 'c.1_hist_rico_de_rotas', path: '/historico', requiresAuth: true },
  { id: 'c.2_detalhe_de_rota_conclu_da', path: '/historico/ROM-2024-88376', requiresAuth: true },
  { id: 'd.1_recibos', path: '/recibos', requiresAuth: true },
  { id: 'd.2_detalhe_do_recibo_com_assinatura', path: '/recibos/receipt-88401', requiresAuth: true },
  { id: 'e.1_perfil_do_motorista', path: '/perfil', requiresAuth: true },
  { id: 'e.2_central_de_suporte_e_ajuda', path: '/suporte', requiresAuth: true },
];

async function clientNavigate(page, targetPath) {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
  await page.waitForTimeout(250);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let loggedIn = false;
  const results = [];
  for (const screen of screens) {
    if (!screen.requiresAuth) {
      await page.goto(`${baseUrl}${screen.path}`, { waitUntil: 'networkidle' });
    } else if (!loggedIn) {
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.fill('input >> nth=0', '12345678900');
      await page.fill('input >> nth=1', '1234');
      await page.click('text=Entrar no sistema');
      await page.waitForURL('**/checklist');
      loggedIn = true;
      if (screen.path !== '/checklist') await clientNavigate(page, screen.path);
    } else {
      await clientNavigate(page, screen.path);
    }
    await page.waitForTimeout(200);
    const file = path.join(outDir, `${screen.id}.png`);
    await page.screenshot({ path: file });
    results.push({ id: screen.id, url: page.url(), file });
    console.log(`captured ${screen.id} -> ${page.url()}`);
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
