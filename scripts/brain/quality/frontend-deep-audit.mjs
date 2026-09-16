import fs from 'node:fs';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = (process.env.QUALITY_BASE_URL || 'https://www.bedrijfsgeheugen.nl').replace(/\/$/, '');
const browserNames = (process.env.QUALITY_BROWSERS || 'chromium,firefox,webkit').split(',').map(x => x.trim()).filter(Boolean);
const registry = JSON.parse(fs.readFileSync('config/ui-visual-regression.json', 'utf8'));
const defaultRoutes = ['/', '/prijzen', '/due-diligence'];
const routes = [...new Set((registry.pages || []).map(x => x.route).concat(defaultRoutes))];
const viewports = registry.defaults?.viewports || [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }];
const engines = { chromium, firefox, webkit };
const failures = [];
const evidence = [];
const artifactDir = process.env.QUALITY_ARTIFACT_DIR || 'artifacts/quality/frontend';
fs.mkdirSync(artifactDir, { recursive: true });

for (const browserName of browserNames) {
  const engine = engines[browserName];
  if (!engine) throw new Error(`unsupported browser: ${browserName}`);
  const browser = await engine.launch({ headless: true });
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      for (const route of routes) {
        const page = await context.newPage();
        const localFailures = [];
        page.on('console', message => { if (message.type() === 'error') localFailures.push({ type: 'console_error', text: message.text() }); });
        page.on('pageerror', error => localFailures.push({ type: 'page_error', text: error.message }));
        page.on('requestfailed', request => localFailures.push({ type: 'request_failed', url: request.url(), text: request.failure()?.errorText || 'failed' }));
        page.on('response', response => {
          const url = response.url();
          if (url.startsWith(baseUrl) && response.status() >= 400) localFailures.push({ type: 'critical_http_error', status: response.status(), url });
        });
        const url = `${baseUrl}${route}`;
        let navigationMs = null;
        try {
          const started = Date.now();
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          navigationMs = Date.now() - started;
          if (!response || response.status() >= 400) localFailures.push({ type: 'navigation', status: response?.status() ?? 0, url });
          const geometry = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            interactive: document.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])').length
          }));
          if (geometry.scrollWidth - geometry.clientWidth > 1) localFailures.push({ type: 'horizontal_overflow', delta_px: geometry.scrollWidth - geometry.clientWidth });
          if (geometry.interactive > 0) {
            await page.keyboard.press('Tab');
            const focus = await page.evaluate(() => ({ tag: document.activeElement?.tagName || '', body: document.activeElement === document.body }));
            if (focus.body || !focus.tag) localFailures.push({ type: 'focus_sanity', text: 'Tab did not move focus to an interactive element' });
          }
          const a11y = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
          for (const violation of a11y.violations.filter(v => ['serious','critical'].includes(v.impact))) {
            localFailures.push({ type: 'accessibility', id: violation.id, impact: violation.impact, nodes: violation.nodes.length });
          }
          if (navigationMs > 3500) localFailures.push({ type: 'navigation_budget', navigation_ms: navigationMs, max_ms: 3500 });
        } catch (error) {
          localFailures.push({ type: 'audit_exception', text: error.message });
        }
        if (localFailures.length) {
          const safe = `${browserName}-${viewport.name}-${route.replace(/[^a-z0-9]+/gi, '-') || 'home'}`;
          await page.screenshot({ path: path.join(artifactDir, `${safe}.png`), fullPage: true }).catch(() => {});
          failures.push(...localFailures.map(item => ({ browser: browserName, viewport: viewport.name, route, ...item })));
        }
        evidence.push({ browser: browserName, viewport: viewport.name, route, navigation_ms: navigationMs, failures: localFailures.length });
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

const report = { fingerprint: 'powerhouse-frontend-deep-audit-v1', base_url: baseUrl, generated_at: new Date().toISOString(), failures, evidence };
fs.writeFileSync(path.join(artifactDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
