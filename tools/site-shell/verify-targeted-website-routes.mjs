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

async function verifyRoute(browser, baseUrl, route, viewport) {
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  const failedAssets = [];
  page.on('pageerror', error => pageErrors.push(String(error?.message || error)));
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
    const summary = summarizeRouteResult({ visibleText, html, pageErrors, failedAssets, httpOk:Boolean(response && response.ok()), identityOk:identity.ok });
    return { route, viewport, status:response?.status() ?? null, finalUrl:page.url(), canonical, title, identity, ...summary };
  } finally { await page.close(); }
}

export async function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const baseUrl = args['base-url'] || process.env.BASE_URL;
  const routes = JSON.parse(args.routes || process.env.ROUTES_JSON || '[]');
  if (!baseUrl || !Array.isArray(routes) || routes.length === 0) throw new TypeError('BASE_URL and a non-empty routes JSON array are required');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless:true });
  const results = [];
  try {
    for (const route of [...new Set(routes)].sort()) {
      results.push(await verifyRoute(browser, baseUrl, route, { width:1440, height:1200 }));
      results.push(await verifyRoute(browser, baseUrl, route, { width:390, height:844 }));
    }
  } finally { await browser.close(); }
  const evidence = { baseUrl, routes:[...new Set(routes)].sort(), ok:results.every(item => item.ok), results };
  const output = args.output || '.artifacts/targeted-route-verification.json';
  await mkdir(dirname(output), { recursive:true });
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
  if (!evidence.ok) process.exitCode = 1;
  return evidence;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli().catch(error => { console.error(error); process.exitCode = 1; });
