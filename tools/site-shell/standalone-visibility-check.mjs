import { chromium } from 'playwright';
import { routesFromSitemap } from './public-route-inventory.mjs';

const baseUrl = process.env.UI_VR_BASE_URL || process.argv[2];
if (!baseUrl) throw new Error('UI_VR_BASE_URL/base URL is required');

const canonicalOrigin = 'https://www.bedrijfsgeheugen.nl';
const navigationTimeoutMs = Number(process.env.UI_VR_NAVIGATION_TIMEOUT_MS || 8000);
const fontReadyTimeoutMs = Number(process.env.UI_VR_FONT_READY_TIMEOUT_MS || 1500);
const totalBudgetMs = Number(process.env.UI_VR_TOTAL_BUDGET_MS || 8 * 60 * 1000);
const configuredRouteConcurrency = Number(process.env.UI_VR_ROUTE_CONCURRENCY || 0);
const cleanupTimeoutMs = Number(process.env.UI_VR_CLEANUP_TIMEOUT_MS || 5000);
const startedAt = Date.now();
let cleanupTimedOut = false;
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const viewportConcurrency = Math.max(1, Math.min(viewports.length, Number(process.env.UI_VR_VIEWPORT_CONCURRENCY || viewports.length)));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function closeBounded(label, closeFn) {
  let finished = false;
  const closePromise = Promise.resolve()
    .then(closeFn)
    .then(() => { finished = true; })
    .catch(error => {
      finished = true;
      console.warn(`${label} cleanup failed after assertions: ${error?.message || error}`);
    });
  await Promise.race([
    closePromise,
    sleep(cleanupTimeoutMs).then(() => {
      if (!finished) {
        cleanupTimedOut = true;
        console.warn(`${label} cleanup exceeded ${cleanupTimeoutMs}ms; process-level cleanup will terminate remaining browser handles`);
      }
    }),
  ]);
}

function assertBudget(route, viewport) {
  const elapsed = Date.now() - startedAt;
  if (elapsed > totalBudgetMs) {
    throw new Error(`Visibility sweep exceeded bounded budget ${totalBudgetMs}ms at ${route} ${viewport}; failing closed instead of leaking a runner`);
  }
}

async function openReachable(page, url) {
  let last;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs });
      if (response?.ok()) return response;
      last = new Error(`HTTP ${response?.status() ?? 'no-response'} ${url}`);
    } catch (error) { last = error; }
    if (attempt < 2) await sleep(500 * attempt);
  }
  throw last || new Error(`Could not load ${url}`);
}

async function waitForFontsBounded(page) {
  await page.evaluate(async timeoutMs => {
    if (!document.fonts?.ready) return;
    await Promise.race([
      document.fonts.ready.catch(() => undefined),
      new Promise(resolve => setTimeout(resolve, timeoutMs)),
    ]);
  }, fontReadyTimeoutMs);
}

async function loadPublicRoutes() {
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
  const response = await fetch(sitemapUrl, { redirect: 'follow', signal: AbortSignal.timeout(navigationTimeoutMs) });
  if (!response.ok) throw new Error(`Public route inventory unavailable: HTTP ${response.status} ${sitemapUrl}`);
  const routes = routesFromSitemap(await response.text(), canonicalOrigin);
  if (routes.length < 20) throw new Error(`Public route inventory suspiciously small: ${routes.length} routes`);
  for (const required of ['/', '/ai-act', '/benchmark']) {
    if (!routes.includes(required)) throw new Error(`Public route inventory missing required route ${required}`);
  }
  return routes;
}

const routes = await loadPublicRoutes();
const routeConcurrency = Math.max(1, Math.min(routes.length, configuredRouteConcurrency > 0 ? configuredRouteConcurrency : Math.min(8, Math.max(4, Math.ceil(routes.length / 12)))));
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  const runViewport = async viewport => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const workerCount = Math.min(routeConcurrency, routes.length);
    try {
      await Promise.all(Array.from({ length: workerCount }, async (_, workerIndex) => {
        const page = await context.newPage();
        await page.addInitScript(() => {
          window.__bgCls = 0;
          try {
            new PerformanceObserver(list => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) window.__bgCls += entry.value;
              }
            }).observe({ type: 'layout-shift', buffered: true });
          } catch {}
        });
        try {
          for (let routeIndex = workerIndex; routeIndex < routes.length; routeIndex += workerCount) {
            const route = routes[routeIndex];
            assertBudget(route, viewport.name);
            const url = new URL(route, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
            try {
              await openReachable(page, url);
              await waitForFontsBounded(page);
              await sleep(150);
              const state = await page.evaluate(() => {
                const inspect = selector => {
                  const el = document.querySelector(selector);
                  if (!el) return { present: false };
                  const r = el.getBoundingClientRect();
                  const s = getComputedStyle(el);
                  const x = Math.max(0, Math.min(innerWidth - 1, r.left + Math.min(r.width / 2, Math.max(1, r.width - 1))));
                  const y = Math.max(0, Math.min(innerHeight - 1, r.top + Math.min(r.height / 2, Math.max(1, r.height - 1))));
                  const top = document.elementFromPoint(x, y);
                  const unobscured = !!top && (el === top || el.contains(top) || top.contains(el));
                  return {
                    present: true,
                    width: r.width,
                    height: r.height,
                    top: r.top,
                    bottom: r.bottom,
                    display: s.display,
                    visibility: s.visibility,
                    opacity: Number(s.opacity),
                    unobscured,
                    topElement: top ? `${top.tagName.toLowerCase()}${top.id ? `#${top.id}` : ''}${top.className && typeof top.className === 'string' ? `.${top.className.trim().replace(/\s+/g,'.')}` : ''}` : 'none',
                  };
                };
                return {
                  header: inspect('header, nav.bgkop, .v17-header'),
                  h1: inspect('main h1'),
                  main: inspect('main'),
                  textLength: (document.querySelector('main')?.innerText || '').trim().length,
                  cls: Number(window.__bgCls || 0),
                };
              });
              for (const [name, item] of Object.entries({ header: state.header, main: state.main, h1: state.h1 })) {
                if (!item.present || item.width < 1 || item.height < 1 || item.display === 'none' || item.visibility === 'hidden' || item.opacity <= 0) {
                  failures.push(`${route} ${viewport.name}: ${name} is not visibly rendered`);
                }
              }
              for (const [name, item] of Object.entries({ header: state.header, h1: state.h1 })) {
                if (item.present && item.top < viewport.height && item.bottom > 0 && !item.unobscured) {
                  failures.push(`${route} ${viewport.name}: ${name} is visually occluded by ${item.topElement}`);
                }
              }
              if (state.textLength < 120) failures.push(`${route} ${viewport.name}: main content is effectively empty (${state.textLength} chars)`);
              if (state.cls > 0.1) failures.push(`${route} ${viewport.name}: CLS ${state.cls.toFixed(3)} exceeds 0.100`);
            } catch (error) {
              failures.push(`${route} ${viewport.name}: ${error.message || error}`);
            }
          }
        } finally {
          await closeBounded(`page ${viewport.name} worker ${workerIndex}`, () => page.close());
        }
      }));
    } finally {
      await closeBounded(`context ${viewport.name}`, () => context.close());
    }
  };

  for (let viewportIndex = 0; viewportIndex < viewports.length; viewportIndex += viewportConcurrency) {
    assertBudget('viewport-batch', viewports[viewportIndex]?.name || 'unknown');
    await Promise.all(viewports.slice(viewportIndex, viewportIndex + viewportConcurrency).map(runViewport));
  }
} finally {
  await closeBounded('browser', () => browser.close());
}

if (failures.length) {
  const message = `Public page visibility failed (${failures.length} issue(s)):\n${failures.join('\n')}`;
  if (cleanupTimedOut) {
    console.error(message);
    process.exit(1);
  }
  throw new Error(message);
}
console.log(`Public page visibility + CLS green: ${routes.length} routes x ${viewports.length} viewports = ${routes.length * viewports.length} browser checks with route concurrency ${routeConcurrency} and viewport concurrency ${viewportConcurrency} within bounded budget ${totalBudgetMs}ms`);
if (cleanupTimedOut) process.exit(0);
