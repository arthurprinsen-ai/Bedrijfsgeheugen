import { chromium } from 'playwright';
import { loadVisualRegressionRegistry, validateProtectedPageCoverage, validateVisualRegressionRegistry } from './contract.mjs';
import { evaluateGeometry } from './geometry.mjs';
import { ensureParent, summarizeFailures, writeVisualRegressionReport } from './report.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function routeUrl(baseUrl, route) {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(route.replace(/^\//, ''), base).href;
}

async function waitForReachable(page, url, attempts = 12) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (response && response.ok()) return response;
      lastError = new Error(`HTTP ${response?.status() ?? 'no-response'} for ${url}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.min(15000, 1500 * attempt));
  }
  throw lastError ?? new Error(`Could not load ${url}`);
}

async function installClsObserver(page) {
  await page.addInitScript(() => {
    window.__bgUiVrCls = { value: 0, entries: [] };
    const selectorFor = node => {
      if (!node || node.nodeType !== 1) return null;
      if (node.id) return `#${CSS.escape(node.id)}`;
      const attrs = Array.from(node.attributes || []).find(a => a.name.startsWith('data-bg-'));
      if (attrs) return `[${attrs.name}]`;
      const classes = Array.from(node.classList || []).slice(0, 3).map(c => `.${CSS.escape(c)}`).join('');
      return `${node.tagName.toLowerCase()}${classes}`;
    };
    const rect = r => r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__bgUiVrCls.value += entry.value;
            window.__bgUiVrCls.entries.push({
              value: entry.value,
              startTime: entry.startTime,
              sources: Array.from(entry.sources || []).map(source => ({
                selector: selectorFor(source.node),
                previousRect: rect(source.previousRect),
                currentRect: rect(source.currentRect)
              }))
            });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
  });
}

async function runInteraction(page, action) {
  const locator = page.locator(action.selector);
  if (await locator.count() === 0) throw new Error(`interaction selector missing: ${action.selector}`);
  if (action.type === 'click') {
    await locator.first().click();
    return;
  }
  if (action.type === 'drag-x-percent') {
    const box = await locator.first().boundingBox();
    if (!box) throw new Error(`interaction selector has no box: ${action.selector}`);
    const x = box.x + (box.width * action.percent / 100);
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(x, y, { steps: 8 });
    await page.mouse.up();
    return;
  }
  throw new Error(`unsupported interaction: ${action.type}`);
}

async function measure(page, pageContract, viewport) {
  return page.evaluate(({ pageContract, viewport }) => {
    const rectFor = el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const required = pageContract.required.map(selector => {
      const el = document.querySelector(selector);
      if (!el) return { selector, present: false };
      const style = getComputedStyle(el);
      return { selector, present: true, rect: rectFor(el), display: style.display, visibility: style.visibility, opacity: style.opacity };
    });
    const pairs = pageContract.protectedPairs.map(pair => {
      const a = document.querySelector(pair.a);
      const b = document.querySelector(pair.b);
      return {
        aSelector: pair.a,
        bSelector: pair.b,
        aPresent: Boolean(a),
        bPresent: Boolean(b),
        a: a ? rectFor(a) : null,
        b: b ? rectFor(b) : null,
        allowance: pair.maxIntersectionAreaPx2
      };
    });
    return {
      viewport,
      required,
      pairs,
      document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
      cls: window.__bgUiVrCls || { value: 0, entries: [] }
    };
  }, { pageContract, viewport });
}

export async function runVisualRegression({ baseUrl, registryPath = 'config/ui-visual-regression.json', outputDir = 'artifacts/ui-visual-regression', routeFilter } = {}) {
  if (!baseUrl) throw new Error('baseUrl is required');
  const registry = await loadVisualRegressionRegistry(registryPath);
  const errors = [...validateVisualRegressionRegistry(registry), ...validateProtectedPageCoverage(registry, ['/', '/prijzen', '/due-diligence'])];
  if (errors.length) throw new Error(`visual regression registry invalid:\n${errors.join('\n')}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const pageContract of registry.pages) {
      if (routeFilter && !routeFilter.includes(pageContract.route)) continue;
      for (const viewport of registry.defaults.viewports) {
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
        const page = await context.newPage();
        await installClsObserver(page);
        const url = routeUrl(baseUrl, pageContract.route);
        let loadViolation = null;
        try {
          await waitForReachable(page, url);
          await page.evaluate(() => document.fonts?.ready);
          await sleep(750);
        } catch (error) {
          loadViolation = { ruleId: 'route-load', actual: String(error?.message || error) };
        }

        const states = [{ name: 'initial' }, ...(pageContract.interactions || []).map((action, index) => ({ name: `${action.type}-${index + 1}`, action }))];
        for (const state of states) {
          let violations = [];
          let sample = null;
          try {
            if (loadViolation) throw new Error(loadViolation.actual);
            if (state.action) {
              await runInteraction(page, state.action);
              await sleep(250);
            }
            sample = await measure(page, pageContract, viewport);
            violations = evaluateGeometry(sample, registry.defaults);
            if (sample.cls.value > registry.defaults.clsMax) violations.push({ ruleId: 'cls', actual: sample.cls.value, limit: registry.defaults.clsMax, entries: sample.cls.entries });
          } catch (error) {
            violations = [{ ruleId: state.action ? 'interaction-or-measurement' : 'route-load', actual: String(error?.message || error) }];
          }

          const result = { route: pageContract.route, url, viewport, state: state.name, cls: sample?.cls ?? null, sample, violations };
          if (violations.length) {
            const safeRoute = pageContract.route === '/' ? 'home' : pageContract.route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
            const screenshotPath = `${outputDir}/${safeRoute}-${viewport.name}-${state.name}.png`;
            try {
              await ensureParent(screenshotPath);
              await page.screenshot({ fullPage: true, path: screenshotPath });
              result.screenshotPath = screenshotPath;
            } catch {}
          }
          results.push(result);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const report = {
    version: registry.version,
    baseUrl,
    commit: process.env.EXPECTED_COMMIT || process.env.GITHUB_SHA || null,
    generatedAt: new Date().toISOString(),
    results
  };
  await writeVisualRegressionReport(report, outputDir);
  const failures = summarizeFailures(report);
  if (failures.length) {
    const error = new Error(`UI visual regression failed:\n${failures.join('\n')}`);
    error.report = report;
    throw error;
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.env.UI_VR_BASE_URL || process.argv[2];
  runVisualRegression({ baseUrl }).then(report => {
    console.log(`UI visual regression green: ${report.results.length} states`);
  }).catch(error => {
    console.error(error.stack || error.message || error);
    process.exitCode = 1;
  });
}
