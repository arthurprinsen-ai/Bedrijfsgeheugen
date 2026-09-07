const { test, expect } = require('@playwright/test');

async function hideNetlifyChrome(page) {
  await page.route('**/cdp/**', route => route.abort());
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'iframe[title="Netlify Drawer"],[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}';
    const attach = () => document.documentElement && document.documentElement.appendChild(style);
    if (document.documentElement) attach(); else document.addEventListener('DOMContentLoaded', attach, { once:true });
  });
}

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || String(error)));
  return errors;
}

test('portal-v2 serves the approved desktop dashboard composition', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = collectPageErrors(page);
  await page.goto(`${preview}/portal-v2/?klant=ijsselmonde`, { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Welkom terug, Arthur', exact: true })).toBeVisible();
  await expect(page.getByText('Grip op je bedrijf. Ruimte om te groeien.', { exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.kpi')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: /Het brein van je bedrijf/ })).toBeVisible();
  await expect(page.locator('.brainimg')).toBeVisible();
  await expect(page.locator('.sources')).toBeVisible();
  await expect(page.locator('.modules')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'AI Management Summary', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Roadmap & voortgang', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kansen & bedreigingen', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Impact overzicht', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recente activiteiten', exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/portal-v2-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('portal-v2 keeps the same design language on a phone without horizontal page overflow', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = collectPageErrors(page);
  await page.goto(`${preview}/portal-v2/?klant=ijsselmonde`, { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Welkom terug, Arthur', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.mobilebar')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Het brein van je bedrijf/ })).toBeVisible();
  await page.screenshot({ path: 'artifacts/portal-v2-mobile.png', fullPage: true });

  const diagnosis = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth - width;
    const offenders = [...document.querySelectorAll('body *')].map(el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        selector: `${el.tagName.toLowerCase()}${el.id ? '#'+el.id : ''}${el.className && typeof el.className === 'string' ? '.'+el.className.trim().split(/\s+/).filter(Boolean).slice(0,3).join('.') : ''}`,
        left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), overflowX: s.overflowX, position: s.position
      };
    }).filter(x => x.right > width + 1 || x.left < -1).slice(0,20);
    return { width, scrollWidth: document.documentElement.scrollWidth, overflow, offenders };
  });
  expect(diagnosis.overflow, JSON.stringify(diagnosis)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});