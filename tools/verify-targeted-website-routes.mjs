import { chromium } from 'playwright';

const baseUrl = String(process.env.BASE_URL || '').replace(/\/$/, '');
const routes = JSON.parse(process.env.ROUTES_JSON || '[]');
if (!baseUrl) throw new Error('BASE_URL is required');
if (!Array.isArray(routes) || routes.length === 0) throw new Error('ROUTES_JSON must contain at least one route');

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
    const context = await browser.newContext({ viewport: { width:viewport.width, height:viewport.height } });
    for (const route of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', error => consoleErrors.push(error.message));
      const url = `${baseUrl}${route === '/' ? '/' : route}`;
      try {
        const response = await page.goto(url, { waitUntil:'networkidle', timeout:45000 });
        const status = response?.status() || 0;
        const visibleText = (await page.locator('body').innerText()).trim();
        const bodyBox = await page.locator('body').boundingBox();
        if (status < 200 || status >= 400) failures.push(`${viewport.name} ${route}: HTTP ${status}`);
        if (visibleText.length < 40) failures.push(`${viewport.name} ${route}: insufficient visible content`);
        if (!bodyBox || bodyBox.width < 100 || bodyBox.height < 100) failures.push(`${viewport.name} ${route}: body not visibly rendered`);
        if (consoleErrors.length) failures.push(`${viewport.name} ${route}: console errors: ${consoleErrors.slice(0,3).join(' | ')}`);
      } catch (error) {
        failures.push(`${viewport.name} ${route}: ${error.message}`);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Targeted browser verification passed for ${routes.length} route(s) on desktop and mobile.`);
