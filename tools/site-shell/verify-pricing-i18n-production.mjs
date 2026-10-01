import { fileURLToPath } from 'node:url';

async function expectVisible(locator, label) {
  if (!await locator.isVisible().catch(()=>false)) throw new Error(label + ' is not visible');
}

async function getVisibleMobileLanguageControl(page, locale) {
  const v18Drawer = page.locator('#v18MobileDrawer').first();
  if (await v18Drawer.count()) {
    const expanded = await v18Drawer.getAttribute('aria-hidden');
    if (expanded !== 'false' || !await v18Drawer.isVisible().catch(()=>false)) {
      const v18Toggle = page.locator('#mobileToggle').first();
      if (!await v18Toggle.count()) throw new Error('v18 mobile drawer exists but #mobileToggle is missing');
      await v18Toggle.click();
      await v18Drawer.waitFor({ state:'visible', timeout:5_000 });
    }
  }

  const legacyMenu = page.locator('#bgkopMob').first();
  if (await legacyMenu.count() && await legacyMenu.isHidden().catch(()=>false)) {
    await page.locator('#bgkopKnop').first().click();
    await legacyMenu.waitFor({ state:'visible', timeout:5_000 });
  }

  const sharedMobileNav = page.locator('#bgSharedMobileNav').first();
  if (await sharedMobileNav.count()) await sharedMobileNav.waitFor({ state:'visible', timeout:5_000 }).catch(()=>{});

  const linkCandidates = [
    page.locator('#v18MobileDrawer [data-bg-language-option="' + locale + '"]').first(),
    page.locator('#bgSharedMobileNav [data-bg-language-option="' + locale + '"]').first(),
    page.locator('#bgkopMob [data-bg-language-option="' + locale + '"]').first(),
    page.locator('[data-bg-language-option="' + locale + '"]:visible').first(),
  ];
  for (const candidate of linkCandidates) {
    if (await candidate.isVisible().catch(()=>false)) return { kind:'link', locator:candidate };
  }

  const selectCandidates = [
    page.locator('#v18MobileDrawer [data-bg-language-select]').first(),
    page.locator('#bgSharedMobileNav [data-bg-language-select]').first(),
    page.locator('#bgkopMob [data-bg-language-select]').first(),
    page.locator('[data-bg-language-select]:visible').first(),
  ];
  for (const candidate of selectCandidates) {
    if (await candidate.isVisible().catch(()=>false)) return { kind:'select', locator:candidate };
  }

  const diagnostics = await page.evaluate(() => ({
    v18Drawer: document.getElementById('v18MobileDrawer')?.getAttribute('aria-hidden') ?? null,
    languageLinks: document.querySelectorAll('[data-bg-language-option]').length,
    languageSelects: document.querySelectorAll('[data-bg-language-select]').length,
  }));
  throw new Error('visible mobile language control is missing after opening mobile navigation: ' + JSON.stringify(diagnostics));
}

async function switchPublicLocale(page, locale, expectedPath) {
  const control = await getVisibleMobileLanguageControl(page, locale);
  const navigation = page.waitForURL(url => {
    const path = new URL(url).pathname.replace(/\/$/, '') || '/';
    const expected = expectedPath.replace(/\/$/, '') || '/';
    return path === expected;
  }, { timeout:30_000, waitUntil:'domcontentloaded' });

  if (control.kind === 'link') {
    await Promise.all([navigation, control.locator.click()]);
  } else {
    await Promise.all([navigation, control.locator.selectOption(locale)]);
  }

  await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
  await page.waitForTimeout(300);
  if ((await page.locator('html').getAttribute('lang')) !== locale) {
    throw new Error('locale switch did not render html lang=' + locale + ' for ' + expectedPath);
  }
  const body = await page.locator('body').innerText();
  if (/Switching language failed\. Try again\./i.test(body)) throw new Error('language switch exposed runtime translation failure on ' + expectedPath);
}

// Compatibility contract: English route still shows the Dutch pricing H1
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
    await page.locator('[data-tab="saas"]').waitFor({state:'visible',timeout:20_000});
    const body = await page.locator('body').innerText();
    for (const token of ['Powerhouse SaaS','Starter','Pro','Groei','Enterprise']) {
      if (!body.includes(token)) throw new Error('pricing SaaS token missing: '+token);
    }
    const saasPanel=page.locator('[data-panel="saas"]').first();
    const consultingPanel=page.locator('[data-panel="consulting"]').first();
    await expectVisible(saasPanel,'SaaS pricing panel');

    await page.locator('[data-tab="consulting"]').click();
    await page.waitForTimeout(150);
    await expectVisible(consultingPanel,'consulting pricing panel after click');
    if (await saasPanel.isVisible().catch(()=>false)) throw new Error('SaaS panel stayed visible after selecting consulting');
    const consultingText=await consultingPanel.innerText();
    for (const token of ['Directie & AI Workshop','Bedrijfsgeheugen Scan','Build Sprint','Transformation / Fractional Lead','Combineer zonder dubbel te betalen']) {
      if (!consultingText.includes(token)) throw new Error('consulting pricing token missing: '+token);
    }

    await page.locator('[data-tab="saas"]').click();
    await page.waitForTimeout(150);
    await expectVisible(saasPanel,'SaaS pricing panel after return');

    await switchPublicLocale(page, 'en', '/en/prijzen');
    const pricingEnglish = await page.locator('body').innerText();
    if (!/Powerhouse SaaS/i.test(pricingEnglish)) throw new Error('English route has no visible Powerhouse SaaS text');
    if (/Kies software of expertise/i.test(pricingEnglish)) throw new Error('English route still shows Dutch pricing hero copy');
    await switchPublicLocale(page, 'nl', '/prijzen');

    const mandatoryRoutes = [
      { nl:'/', en:'/en' },
      { nl:'/prijzen', en:'/en/prijzen' },
      { nl:'/systemen-koppelen', en:'/en/systemen-koppelen' },
    ];
    for (const route of mandatoryRoutes) {
      await page.goto(baseUrl.replace(/\/$/,'') + route.nl + '?locale_proof=' + nonce, { waitUntil:'domcontentloaded', timeout:30_000 });
      await switchPublicLocale(page, 'en', route.en);
      await switchPublicLocale(page, 'nl', route.nl);
      if (/^\/nl(?:\/|$)/.test(new URL(page.url()).pathname)) throw new Error('Dutch switch leaked to deprecated /nl/* route');
    }

    if (errors.length) throw new Error('Browser page errors: ' + JSON.stringify(errors));
    console.log(JSON.stringify({status:'COMMERCIAL_PRICING_I18N_PRODUCTION_PROVEN',url:page.url(),pricingTabs:'saas-consulting',locale:'nl',roundtrip:'nl-en-nl'}));
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
