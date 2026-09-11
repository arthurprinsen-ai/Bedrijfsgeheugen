import { chromium } from 'playwright';
import { routesFromSitemap } from './public-route-inventory.mjs';

const baseUrl = process.env.UI_VR_BASE_URL || process.argv[2];
if (!baseUrl) throw new Error('UI_VR_BASE_URL/base URL is required');

const canonicalOrigin = 'https://www.bedrijfsgeheugen.nl';
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function openReachable(page, url) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      if (response?.ok()) return response;
      last = new Error(`HTTP ${response?.status() ?? 'no-response'} ${url}`);
    } catch (error) { last = error; }
    await sleep(Math.min(4000, 500 * attempt));
  }
  throw last || new Error(`Could not load ${url}`);
}

async function loadPublicRoutes() {
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
  const response = await fetch(sitemapUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Public route inventory unavailable: HTTP ${response.status} ${sitemapUrl}`);
  const routes = routesFromSitemap(await response.text(), canonicalOrigin);
  if (routes.length < 20) throw new Error(`Public route inventory suspiciously small: ${routes.length} routes`);
  for (const required of ['/', '/ai-act', '/benchmark']) {
    if (!routes.includes(required)) throw new Error(`Public route inventory missing required route ${required}`);
  }
  return routes;
}

const routes = await loadPublicRoutes();
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
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
      for (const route of routes) {
        const url = new URL(route, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
        try {
          await openReachable(page, url);
          await page.evaluate(() => document.fonts?.ready);
          await sleep(300);
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
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) throw new Error(`Public page visibility failed (${failures.length} issue(s)):\n${failures.join('\n')}`);
console.log(`Public page visibility + CLS green: ${routes.length} routes x ${viewports.length} viewports = ${routes.length * viewports.length} browser checks`);
