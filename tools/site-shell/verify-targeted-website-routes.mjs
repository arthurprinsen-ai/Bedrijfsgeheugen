import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function routeIdentity({ route, canonical, title } = {}) {
  const expected = String(route || '/').replace(/\/$/, '') || '/';
  let canonicalPath = null;
  try { canonicalPath = new URL(String(canonical || '')).pathname.replace(/\/$/, '') || '/'; } catch {}
  const titleOk = String(title || '').trim().length > 0;
  return Object.freeze({ ok: canonicalPath === expected && titleOk, expected, canonicalPath, titleOk });
}

export function newPageErrors(previewErrors = [], baselineErrors = []) {
  const accepted = new Set(baselineErrors.map(value => String(value)));
  return [...new Set(previewErrors.map(value => String(value)).filter(value => !accepted.has(value)))];
}

export function productionPageErrors(observedErrors = [], allowExisting = false) {
  return allowExisting ? [] : [...new Set(observedErrors.map(value => String(value)))];
}

export function summarizeRouteResult({ visibleText = '', html = '', pageErrors = [], failedAssets = [], httpOk = true, identityOk = true } = {}) {
  const hasVisibleContent = String(visibleText).trim().length > 0 && String(html).trim().length > 0;
  const ok = Boolean(httpOk && identityOk && hasVisibleContent && pageErrors.length === 0 && failedAssets.length === 0);
  return Object.freeze({ ok, hasVisibleContent, pageErrors:[...pageErrors], failedAssets:[...failedAssets] });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1];
  return out;
}

async function navigateWithRetry(page, url, { attempts = 3, timeout = 30_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await page.goto(url, { waitUntil:'domcontentloaded', timeout });
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || error?.name !== 'TimeoutError') throw error;
      await page.waitForTimeout(1_500 * attempt);
    }
  }
  throw lastError;
}

async function verifyPricingInteractions(page, route, viewport) {
  if (route !== '/prijzen' || Number(viewport?.width) > 430) return { ok:true, skipped:true };

  const result = await page.evaluate(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const click = selector => {
      const el = document.querySelector(selector);
      if (!el) return false;
      el.click();
      return true;
    };

    const beforeVisible = [...document.querySelectorAll('[data-bg-stage-panel]')].filter(el => !el.hidden).map(el => el.getAttribute('data-bg-stage-panel'));
    const stageClicked = click('[data-bg-stage="loss"]');
    await wait(80);
    const afterVisible = [...document.querySelectorAll('[data-bg-stage-panel]')].filter(el => !el.hidden).map(el => el.getAttribute('data-bg-stage-panel'));

    const billingClicked = click('[data-bg-billing="yearly"]');
    await wait(80);
    const yearlyPressed = document.querySelector('[data-bg-billing="yearly"]')?.getAttribute('aria-pressed') === 'true';
    const controlPrice = [...document.querySelectorAll('.bg-billing-price')].map(el => el.textContent || '').find(text => text.includes('14.950')) || '';

    const language = document.querySelector('[data-bg-language-select]');
    let languageChanged = false;
    let languageErrorHidden = true;
    if (language) {
      language.value = 'en';
      language.dispatchEvent(new Event('change',{bubbles:true}));
      for (let i=0;i<40;i++) {
        await wait(100);
        if (document.documentElement.dataset.bgLocale === 'en' && document.documentElement.lang === 'en') break;
      }
      languageChanged = document.documentElement.dataset.bgLocale === 'en' && document.documentElement.lang === 'en';
      languageErrorHidden = [...document.querySelectorAll('[data-bg-language-error]')].every(el => el.hidden);
    }

    return {
      beforeVisible,
      stageClicked,
      afterVisible,
      billingClicked,
      yearlyPressed,
      controlPrice,
      languageControlFound:Boolean(language),
      languageChanged,
      languageErrorHidden,
      runtime:document.documentElement.dataset.bgPricingInteractions || null
    };
  });

  const ok =
    result.beforeVisible.length === 1 &&
    result.stageClicked &&
    result.afterVisible.length === 1 &&
    result.afterVisible[0] === 'loss' &&
    result.billingClicked &&
    result.yearlyPressed &&
    result.controlPrice.includes('14.950') &&
    result.languageControlFound &&
    result.languageChanged &&
    result.languageErrorHidden &&
    result.runtime === 'v4';

  return { ok, skipped:false, ...result };
}

async function observeRoute(browser, baseUrl, route, viewport) {
  const page = await browser.newPage({ viewport });
  const observedPageErrors = [];
  const failedAssets = [];
  page.on('pageerror', error => observedPageErrors.push(String(error?.message || error)));
  page.on('requestfailed', request => {
    try {
      const url = new URL(request.url());
      const base = new URL(baseUrl);
      const type = request.resourceType();
      if (url.origin === base.origin && ['document','stylesheet','script'].includes(type)) failedAssets.push(`${type}:${url.pathname}`);
    } catch {}
  });
  try {
    const target = `${baseUrl.replace(/\/$/, '')}${route === '/' ? '/' : route}`;
    const response = await navigateWithRetry(page, target);
    await page.locator('body').waitFor({ state:'visible', timeout:15_000 });
    await page.waitForTimeout(750);
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href').catch(() => null);
    const title = await page.title();
    const interactions = await verifyPricingInteractions(page, route, viewport);
    const visibleText = await page.locator('body').innerText().catch(() => '');
    const html = await page.content();
    const identity = routeIdentity({ route, canonical: canonical || page.url(), title });
    return {
      route,
      viewport,
      status:response?.status() ?? null,
      finalUrl:page.url(),
      canonical,
      title,
      identity,
      interactions,
      visibleText,
      html,
      observedPageErrors:[...new Set(observedPageErrors)],
      failedAssets:[...new Set(failedAssets)],
      httpOk:Boolean(response && response.ok()),
    };
  } finally { await page.close(); }
}

async function verifyRoute(browser, baseUrl, route, viewport, { baselinePageErrors = [], allowExistingPageErrors = false } = {}) {
  const observation = await observeRoute(browser, baseUrl, route, viewport);
  const pageErrors = allowExistingPageErrors
    ? productionPageErrors(observation.observedPageErrors, true)
    : newPageErrors(observation.observedPageErrors, baselinePageErrors);
  const summary = summarizeRouteResult({
    visibleText:observation.visibleText,
    html:observation.html,
    pageErrors,
    failedAssets:observation.failedAssets,
    httpOk:observation.httpOk,
    identityOk:observation.identity.ok && observation.interactions?.ok !== false,
  });
  const { visibleText, html, httpOk, ...evidence } = observation;
  return { ...evidence, baselinePageErrors:[...baselinePageErrors], allowExistingPageErrors, ...summary };
}

export async function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const baseUrl = args['base-url'] || process.env.BASE_URL;
  const baselineUrl = args['baseline-url'] || process.env.BASELINE_URL || null;
  const allowExistingPageErrors = String(args['allow-existing-page-errors'] || process.env.ALLOW_EXISTING_PAGE_ERRORS || '').toLowerCase() === 'true';
  const routes = JSON.parse(args.routes || process.env.ROUTES_JSON || '[]');
  if (!baseUrl || !Array.isArray(routes) || routes.length === 0) throw new TypeError('BASE_URL and a non-empty routes JSON array are required');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless:true });
  const results = [];
  const baseline = [];
  const viewports = [{ width:1440, height:1200 }, { width:390, height:844 }];
  try {
    for (const route of [...new Set(routes)].sort()) {
      for (const viewport of viewports) {
        let baselinePageErrors = [];
        if (baselineUrl) {
          const baselineObservation = await observeRoute(browser, baselineUrl, route, viewport);
          baselinePageErrors = baselineObservation.observedPageErrors;
          baseline.push({
            route,
            viewport,
            status:baselineObservation.status,
            finalUrl:baselineObservation.finalUrl,
            pageErrors:baselineObservation.observedPageErrors,
            failedAssets:baselineObservation.failedAssets,
          });
        }
        results.push(await verifyRoute(browser, baseUrl, route, viewport, { baselinePageErrors, allowExistingPageErrors }));
      }
    }
  } finally { await browser.close(); }
  const evidence = { baseUrl, baselineUrl, allowExistingPageErrors, routes:[...new Set(routes)].sort(), ok:results.every(item => item.ok), baseline, results };
  const output = args.output || '.artifacts/targeted-route-verification.json';
  await mkdir(dirname(output), { recursive:true });
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.ok) process.exitCode = 1;
  return evidence;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli().catch(error => { console.error(error); process.exitCode = 1; });
