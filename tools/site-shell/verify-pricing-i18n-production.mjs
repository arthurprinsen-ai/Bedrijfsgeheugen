import { fileURLToPath } from 'node:url';

async function expectVisible(locator, label) {
  if (!await locator.isVisible().catch(()=>false)) throw new Error(label + ' is not visible');
}

async function getVisibleMobileLanguage(page) {
  const v18Drawer = page.locator('#v18MobileDrawer').first();
  if (await v18Drawer.count()) {
    const expanded = await v18Drawer.getAttribute('aria-hidden');
    if (expanded !== 'false' || !await v18Drawer.isVisible().catch(()=>false)) {
      const v18Toggle = page.locator('#mobileToggle').first();
      if (!await v18Toggle.count()) throw new Error('v18 mobile drawer exists but #mobileToggle is missing');
      await v18Toggle.click();
      await v18Drawer.waitFor({ state:'visible', timeout:5_000 });
    }
    const select = v18Drawer.locator('[data-bg-language-select]').first();
    if (await select.isVisible().catch(()=>false)) return select;
  }

  const legacyMenu = page.locator('#bgkopMob').first();
  if (await legacyMenu.count() && await legacyMenu.isHidden().catch(()=>false)) {
    await page.locator('#bgkopKnop').first().click();
    await legacyMenu.waitFor({ state:'visible', timeout:5_000 });
  }

  const sharedMobileNav = page.locator('#bgSharedMobileNav').first();
  if (await sharedMobileNav.count()) await sharedMobileNav.waitFor({ state:'visible', timeout:5_000 }).catch(()=>{});

  const candidates = [
    page.locator('#bgSharedMobileNav [data-bg-language-select]').first(),
    page.locator('#bgkopMob [data-bg-language-select]').first(),
    page.locator('[data-bg-language-select]:visible').first(),
  ];
  for (const candidate of candidates) {
    if (await candidate.isVisible().catch(()=>false)) return candidate;
  }

  const diagnostics = await page.evaluate(() => ({
    v18Drawer: document.getElementById('v18MobileDrawer')?.getAttribute('aria-hidden') ?? null,
    v18Selects: document.querySelectorAll('#v18MobileDrawer [data-bg-language-select]').length,
    legacySelects: document.querySelectorAll('#bgkopMob [data-bg-language-select]').length,
    sharedSelects: document.querySelectorAll('#bgSharedMobileNav [data-bg-language-select]').length,
    allSelects: document.querySelectorAll('[data-bg-language-select]').length,
  }));
  throw new Error('visible mobile language select is missing after opening mobile navigation: ' + JSON.stringify(diagnostics));
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

    // Public language switching must use the actually visible control for this viewport.
    const mobileLanguage = await getVisibleMobileLanguage(page);
    await Promise.all([
      page.waitForURL(url => /^\/en\/prijzen\/?$/.test(new URL(url).pathname), { timeout:20_000 }),
      mobileLanguage.selectOption('en'),
    ]);
    await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
    await page.waitForTimeout(500);
    if ((await page.locator('html').getAttribute('lang')) !== 'en') throw new Error('English route did not render html lang=en');
    const body = await page.locator('body').innerText();
    if (/Switching language failed\. Try again\./i.test(body)) throw new Error('English switch still exposes runtime translation failure');
    if (/Prijzen voor digitalisering in het mkb/i.test(body)) throw new Error('English route still shows the Dutch pricing H1');
    if (!/Pricing/i.test(body)) throw new Error('English route has no visible Pricing text');

    const dutchSelect = await getVisibleMobileLanguage(page);
    await Promise.all([
      page.waitForURL(url => /^\/prijzen\/?$/.test(new URL(url).pathname), { timeout:20_000 }),
      dutchSelect.selectOption('nl'),
    ]);
    await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
    await page.waitForTimeout(300);
    if ((await page.locator('html').getAttribute('lang')) !== 'nl') throw new Error('Dutch route did not render html lang=nl');
    if (/^\/nl(?:\/|$)/.test(new URL(page.url()).pathname)) throw new Error('Dutch switch leaked to deprecated /nl/* route');

    if (errors.length) throw new Error('Browser page errors: ' + JSON.stringify(errors));
    console.log(JSON.stringify({status:'PRICING_I18N_PRODUCTION_BEHAVIOR_PROVEN',url:page.url(),stage:'loss',group:'run',billing:'yearly',locale:'nl',roundtrip:'nl-en-nl'}));
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
