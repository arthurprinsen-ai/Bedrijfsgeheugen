import { chromium } from 'playwright';

const baseUrl = process.env.UI_VR_BASE_URL || process.argv[2];
if (!baseUrl) throw new Error('UI_VR_BASE_URL/base URL is required');

const routes = ['/ai-act', '/benchmark'];
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function openReachable(page, url) {
  let last;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (response?.ok()) return;
      last = new Error(`HTTP ${response?.status() ?? 'no-response'} ${url}`);
    } catch (error) { last = error; }
    await sleep(Math.min(10000, 1000 * attempt));
  }
  throw last || new Error(`Could not load ${url}`);
}

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const route of routes) {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      const url = new URL(route, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
      try {
        await openReachable(page, url);
        await page.evaluate(() => document.fonts?.ready);
        await sleep(500);
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
            header: inspect('header'),
            h1: inspect('main h1'),
            main: inspect('main'),
            textLength: (document.querySelector('main')?.innerText || '').trim().length,
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
      } catch (error) {
        failures.push(`${route} ${viewport.name}: ${error.message || error}`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

if (failures.length) throw new Error(`Standalone page visibility failed:\n${failures.join('\n')}`);
console.log(`Standalone page visibility green: ${routes.join(', ')} on ${viewports.map(v => v.name).join(', ')}`);
