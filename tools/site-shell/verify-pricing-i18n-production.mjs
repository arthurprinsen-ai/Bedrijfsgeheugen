import { fileURLToPath } from 'node:url';

async function expectVisible(locator, label) {
  if (!await locator.isVisible().catch(()=>false)) throw new Error(label + ' is not visible');
}

async function run() {
  const baseUrl = process.env.BASE_URL || 'https://www.bedrijfsgeheugen.nl';
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless:true });
  const page = await browser.newPage({ viewport:{ width:390, height:844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error?.message || error)));
  try {
    const nonce = encodeURIComponent(process.env.GITHUB_SHA || Date.now());
    await page.goto(baseUrl.replace(/\/$/,'') + '/prijzen?interaction_proof=' + nonce, { waitUntil:'domcontentloaded', timeout:30_000 });
    await page.locator('body').waitFor({ state:'visible', timeout:15_000 });

    // Lifecycle toggle must change the actual visible panel.
    await page.locator('[data-bg-stage="loss"]').click();
    await page.waitForTimeout(150);
    const loss = page.locator('[data-bg-stage-panel="loss"]');
    const grow = page.locator('[data-bg-stage-panel="grow"]');
    await expectVisible(loss, 'loss stage panel after click');
    if (await grow.isVisible().catch(()=>false)) throw new Error('grow stage panel stayed visible after selecting loss');
    if ((await page.locator('[data-bg-stage="loss"]').getAttribute('aria-selected')) !== 'true') throw new Error('loss stage aria-selected did not become true');

    // Start/run tab must alter visible plan-card group.
    await page.locator('[data-bg-price-tab="run"]').click();
    await page.waitForTimeout(150);
    if ((await page.locator('[data-bg-price-tab="run"]').getAttribute('aria-selected')) !== 'true') throw new Error('run tab aria-selected did not become true');
    const runCards = page.locator('.bg-plan-card[data-bg-group="run"]');
    if (await runCards.count() === 0) throw new Error('run plan cards are missing');
    await expectVisible(runCards.first(), 'run plan card after click');
    const startCards = page.locator('.bg-plan-card[data-bg-group="start"]');
    if (await startCards.first().isVisible().catch(()=>false)) throw new Error('start plan card stayed visible after selecting run');

    // Billing switch must update both selected state and at least one price.
    const priced = page.locator('[data-monthly][data-yearly]').first();
    const before = (await priced.textContent().catch(()=>'')) || '';
    await page.locator('[data-bg-billing="yearly"]').click();
    await page.waitForTimeout(150);
    const after = (await priced.textContent().catch(()=>'')) || '';
    if ((await page.locator('[data-bg-billing="yearly"]').getAttribute('aria-selected')) !== 'true') throw new Error('yearly billing aria-selected did not become true');
    if (before.trim() === after.trim()) throw new Error('yearly billing click did not change a price');

    // Public language switching must use the static English route, not runtime provider translation.
    const current = page.locator('button[data-bg-language-current]').first();
    await current.click();
    const english = page.locator('[data-bg-language-option="en"]').first();
    await Promise.all([
      page.waitForURL(url => /^\/en\/prijzen\/?$/.test(new URL(url).pathname), { timeout:20_000 }),
      english.click(),
    ]);
    await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
    await page.waitForTimeout(500);
    if ((await page.locator('html').getAttribute('lang')) !== 'en') throw new Error('English route did not render html lang=en');
    const body = await page.locator('body').innerText();
    if (/Switching language failed\. Try again\./i.test(body)) throw new Error('English switch still exposes runtime translation failure');
    if (/Prijzen voor digitalisering in het mkb/i.test(body)) throw new Error('English route still shows the Dutch pricing H1');
    if (!/Pricing/i.test(body)) throw new Error('English route has no visible Pricing text');
    if (errors.length) throw new Error('Browser page errors: ' + JSON.stringify(errors));
    console.log(JSON.stringify({status:'PRICING_I18N_PRODUCTION_BEHAVIOR_PROVEN',url:page.url(),stage:'loss',group:'run',billing:'yearly',locale:'en'}));
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
