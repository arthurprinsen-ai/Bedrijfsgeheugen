import { fileURLToPath } from 'node:url';

async function expectVisible(locator, label) {
  if (!await locator.isVisible().catch(()=>false)) throw new Error(label + ' is not visible');
}

function normalizedPath(pathname) {
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

async function getVisibleMobileLanguage(page) {
  const legacyMenu = page.locator('#bgkopMob').first();
  const legacyButton = page.locator('#bgkopKnop').first();
  if (await legacyMenu.count() && await legacyMenu.isHidden().catch(()=>false)) {
    await legacyButton.click();
    await page.waitForTimeout(100);
  }

  let select = page.locator('#bgkopMob [data-bg-language-select]:visible').first();
  if (await select.isVisible().catch(()=>false)) return select;

  select = page.locator('[data-bg-language-select]:visible').first();
  if (await select.isVisible().catch(()=>false)) return select;

  const diagnostics = await page.evaluate(() => ({
    allSelects: document.querySelectorAll('[data-bg-language-select]').length,
    legacySelects: document.querySelectorAll('#bgkopMob [data-bg-language-select]').length,
    legacyHidden: document.getElementById('bgkopMob')?.hidden ?? null,
    mobileHosts: document.querySelectorAll('[data-bg-mobile-view="root"], [data-bg-shared-mobile-view="root"], #bgkopMob').length,
  }));
  throw new Error('visible mobile language select is missing: ' + JSON.stringify(diagnostics));
}

async function switchPublicLocale(page, target, expectedPath) {
  const select = await getVisibleMobileLanguage(page);
  await Promise.all([
    page.waitForURL(url => normalizedPath(new URL(url).pathname) === normalizedPath(expectedPath), { timeout:20_000 }),
    select.selectOption(target),
  ]);
  await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
  await page.waitForTimeout(350);
  const expectedLang = target === 'en' ? 'en' : 'nl';
  if ((await page.locator('html').getAttribute('lang')) !== expectedLang) {
    throw new Error(expectedLang + ' route did not render html lang=' + expectedLang);
  }
  const body = await page.locator('body').innerText();
  if (/Switching language failed\. Try again\.|Wisselen mislukt\. Probeer opnieuw\./i.test(body)) {
    throw new Error('language switch exposes runtime translation failure on ' + expectedPath);
  }
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
    await page.waitForFunction(() => {
      const root = document.documentElement;
      return root?.dataset?.bgPricingInteractions === 'ready-v3'
        && Boolean(document.querySelector('[data-bg-stage="loss"]'));
    }, null, { timeout:20_000 });

    // Lifecycle toggle must change the actual visible panel.
    // Read geometry directly from the DOM so a missing control fails with explicit state,
    // rather than Playwright Locator auto-waiting for 30 seconds.
    const lossButton = page.locator('[data-bg-stage="loss"]');
    const lossVisibility = await page.evaluate(() => {
      const element = document.querySelector('[data-bg-stage="loss"]');
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity || '1'),
        width: rect.width,
        height: rect.height,
      };
    });
    if (!lossVisibility) throw new Error('loss stage control is missing after pricing readiness');
    if (lossVisibility.display === 'none' || lossVisibility.visibility === 'hidden' || lossVisibility.opacity === 0 || lossVisibility.width < 1 || lossVisibility.height < 1) {
      throw new Error('loss stage control is not visibly actionable: ' + JSON.stringify(lossVisibility));
    }
    await page.evaluate(() => {
      const element = document.querySelector('[data-bg-stage="loss"]');
      if (!element) throw new Error('loss stage control disappeared before scroll');
      element.scrollIntoView({ block:'center', inline:'nearest', behavior:'instant' });
    });
    await page.waitForTimeout(100);
    const lossBox = await page.evaluate(() => {
      const element = document.querySelector('[data-bg-stage="loss"]');
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    if (!lossBox) throw new Error('loss stage control disappeared before pointer click');
    if (lossBox.width < 1 || lossBox.height < 1) throw new Error('loss stage control has no actionable box: ' + JSON.stringify(lossBox));
    await page.mouse.click(lossBox.x + lossBox.width / 2, lossBox.y + lossBox.height / 2);
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
    if ((await page.locator('[data-bg-billing="yearly"]').getAttribute('aria-pressed')) !== 'true') throw new Error('yearly billing aria-pressed did not become true');
    if (before.trim() === after.trim()) throw new Error('yearly billing click did not change a price');

    // Public language switching must use the actually visible active mobile control.
    await switchPublicLocale(page, 'en', '/en/prijzen');
    const pricingEnglishBody = await page.locator('body').innerText();
    if (/Prijzen voor digitalisering in het mkb/i.test(pricingEnglishBody)) throw new Error('English route still shows the Dutch pricing H1');
    if (!/Pricing/i.test(pricingEnglishBody)) throw new Error('English route has no visible Pricing text');
    await switchPublicLocale(page, 'nl', '/prijzen');
    if (/^\/nl(?:\/|$)/.test(new URL(page.url()).pathname)) throw new Error('Dutch switch leaked to deprecated /nl/* route');

    // The same central locale runtime must work on the homepage and integrations route.
    for (const route of [
      { nl:'/', en:'/en/' },
      { nl:'/systemen-koppelen', en:'/en/systemen-koppelen' },
    ]) {
      await page.goto(baseUrl.replace(/\/$/,'') + route.nl + (route.nl.includes('?') ? '&' : '?') + 'i18n_route_proof=' + nonce, { waitUntil:'domcontentloaded', timeout:30_000 });
      await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
      if ((await page.locator('html').getAttribute('lang')) !== 'nl') throw new Error('Dutch source route did not render html lang=nl: ' + route.nl);
      await switchPublicLocale(page, 'en', route.en);
      await switchPublicLocale(page, 'nl', route.nl);
    }

    if (errors.length) throw new Error('Browser page errors: ' + JSON.stringify(errors));
    console.log(JSON.stringify({status:'PRICING_I18N_PRODUCTION_BEHAVIOR_PROVEN',url:page.url(),stage:'loss',group:'run',billing:'yearly',locale:'nl',roundtrip:'nl-en-nl',routes:['/','/prijzen','/systemen-koppelen']}));
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
