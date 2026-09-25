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

export function filterSettledNavigationFailures(failedAssets = [], { httpOk = false, finalUrl = '' } = {}) {
  if (!httpOk) return [...failedAssets];
  let finalPath = '';
  try { finalPath = new URL(String(finalUrl)).pathname || '/'; } catch {}
  return failedAssets.filter(value => String(value) !== `document:${finalPath}`);
}

export function isHardAssetFailure({ type = '', errorText = '' } = {}) {
  const resourceType = String(type || '');
  const failure = String(errorText || '');
  if (resourceType === 'document' && failure === 'net::ERR_ABORTED') return false;
  return ['document','stylesheet','script'].includes(resourceType);
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

async function navigateWithRetry(page, url, { attempts = 2, timeout = 20_000 } = {}) {
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

async function observeRouteAttempt(browser, baseUrl, route, viewport) {
  const page = await browser.newPage({ viewport });
  const observedPageErrors = [];
  const failedAssets = [];
  page.on('pageerror', error => observedPageErrors.push(String(error?.message || error)));
  page.on('requestfailed', request => {
    try {
      const url = new URL(request.url());
      const base = new URL(baseUrl);
      const type = request.resourceType();
      const errorText = request.failure()?.errorText || '';
      if (url.origin === base.origin && isHardAssetFailure({ type, errorText })) failedAssets.push(`${type}:${url.pathname}`);
    } catch {}
  });
  try {
    const target = `${baseUrl.replace(/\/$/, '')}${route === '/' ? '/' : route}`;
    const response = await navigateWithRetry(page, target);
    await page.locator('body').waitFor({ state:'attached', timeout:10_000 });
    await page.waitForFunction(() => {
      const body=document.body;
      if(!body || !String(body.innerText||'').trim()) return false;
      return [...body.children].some(el => {
        const style=getComputedStyle(el);
        const rect=el.getBoundingClientRect();
        return style.display!=='none'
          && style.visibility!=='hidden'
          && Number.parseFloat(style.opacity||'1')>0
          && rect.width>0
          && rect.height>0;
      });
    }, { timeout:10_000 });
    await page.waitForTimeout(750);
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
      failedAssets:filterSettledNavigationFailures([...new Set(failedAssets)], {
        httpOk:Boolean(response && response.ok()),
        finalUrl:page.url(),
      }),
      httpOk:Boolean(response && response.ok()),
    };
  } finally { await page.close(); }
}

async function observeRoute(browser, baseUrl, route, viewport, { attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await observeRouteAttempt(browser, baseUrl, route, viewport);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || error?.name !== 'TimeoutError') throw error;
      await new Promise(resolve => setTimeout(resolve, 1_000 * attempt));
    }
  }
  throw lastError;
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

async function mapWithConcurrency(items, limit, worker) {
  const safeLimit=Math.max(1,Math.min(Number.isFinite(limit)?Math.floor(limit):1,items.length||1));
  const output=new Array(items.length);
  let cursor=0;
  await Promise.all(Array.from({length:safeLimit}, async()=>{
    while(true){
      const index=cursor++;
      if(index>=items.length) return;
      output[index]=await worker(items[index],index);
    }
  }));
  return output;
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
  const viewports = [{ width:1440, height:1200 }, { width:390, height:844 }];
  const uniqueRoutes=[...new Set(routes)].sort();
  const tasks=uniqueRoutes.flatMap(route=>viewports.map(viewport=>({route,viewport})));
  const concurrency=Math.max(1,Math.min(Number(args.concurrency || process.env.ROUTE_VERIFY_CONCURRENCY || 4) || 4,8));
  let observations=[];
  try {
    observations=await mapWithConcurrency(tasks,concurrency,async({route,viewport})=>{
      let baselinePageErrors=[];
      let baselineEntry=null;
      if(baselineUrl){
        const baselineObservation=await observeRoute(browser,baselineUrl,route,viewport);
        baselinePageErrors=baselineObservation.observedPageErrors;
        baselineEntry={
          route,
          viewport,
          status:baselineObservation.status,
          finalUrl:baselineObservation.finalUrl,
          pageErrors:baselineObservation.observedPageErrors,
          failedAssets:baselineObservation.failedAssets,
        };
      }
      const result=await verifyRoute(browser,baseUrl,route,viewport,{baselinePageErrors,allowExistingPageErrors});
      return {result,baselineEntry};
    });
  } finally { await browser.close(); }
  const results=observations.map(item=>item.result).sort((a,b)=>a.route.localeCompare(b.route)||a.viewport.width-b.viewport.width);
  const baseline=observations.map(item=>item.baselineEntry).filter(Boolean).sort((a,b)=>a.route.localeCompare(b.route)||a.viewport.width-b.viewport.width);
  const evidence = { baseUrl, baselineUrl, allowExistingPageErrors, routes:uniqueRoutes, concurrency, ok:results.every(item => item.ok), baseline, results };
  const output = args.output || '.artifacts/targeted-route-verification.json';
  await mkdir(dirname(output), { recursive:true });
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.ok) process.exitCode = 1;
  return evidence;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli().catch(error => { console.error(error); process.exitCode = 1; });
