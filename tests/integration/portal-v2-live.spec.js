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

  const rootOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(rootOverflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});