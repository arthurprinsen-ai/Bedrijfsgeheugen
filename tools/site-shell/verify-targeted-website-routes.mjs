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
    const response = await page.goto(`${baseUrl.replace(/\/$/, '')}${route === '/' ? '/' : route}`, { waitUntil:'networkidle', timeout:90_000 });
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href').catch(() => null);
    const title = await page.title();
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
    identityOk:observation.identity.ok,
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
