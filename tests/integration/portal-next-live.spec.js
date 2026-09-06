const { test, expect } = require('@playwright/test');

const ROUTES = ['Strategie','Groei','Operatie','Organisatie','Data & Technologie','Uitvoering','Mijn werk','Model Library','Trust & Governance','Beheer'];

async function isolateProductFromPreviewChrome(page) {
  // Netlify injects deploy-preview review chrome which is not part of the product.
  // Block the remote review runtime and hide any residual drawer container.
  await page.route('**/cdp/**', route => route.abort());
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'iframe[title="Netlify Drawer"],[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}';
    const attach = () => { if (document.documentElement) document.documentElement.appendChild(style); };
    if (document.documentElement) attach(); else document.addEventListener('DOMContentLoaded', attach, { once:true });
  });
}

function routeButton(page, route) {
  return page.locator(`.sidebar [data-route="${route}"]`);
}

function mobileRouteButton(page, route) {
  return page.locator(`.mobile-nav [data-mobile-route="${route}"]`);
}

function collectInteractionErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || String(error)));
  return errors;
}

async function assertDesktopReady(page) {
  await expect(page.getByRole('heading', { name: 'AI Management Summary', exact: true })).toBeVisible();
  await expect(routeButton(page, 'Overzicht')).toHaveClass(/is-active/);
  await expect(page.locator('#globalSearch')).toBeVisible();
}

async function assertMobileReady(page) {
  await expect(page.getByRole('heading', { name: 'AI Management Summary', exact: true })).toBeVisible();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(mobileRouteButton(page, 'Overzicht')).toBeVisible();
  await expect(page.locator('#globalSearch')).toBeAttached();
}

test('next portal desktop navigation, drawers and command route work on live preview', async ({ page }) => {
  test.setTimeout(45000);
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await isolateProductFromPreviewChrome(page);

  await page.goto(`${preview}/portal-next/`, { waitUntil: 'networkidle' });
  await assertDesktopReady(page);
  // Load-time product syntax is separately fail-closed by node --check on the exact
  // served JS. From here on pageerror measures product interaction/runtime only.
  const pageErrors = collectInteractionErrors(page);

  for (const route of ROUTES) {
    const button = routeButton(page, route);
    await button.click();
    await expect(page.locator('.workspace-hero h2')).toBeVisible();
    await expect(button).toHaveClass(/is-active/);
  }

  await routeButton(page, 'Trust & Governance').click();
  await expect(page.getByRole('heading', { name: 'AI Register', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agent Team', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Access Center', exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Waarom deze toegang/i }).click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer')).not.toHaveClass(/open/);

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await expect(page.locator('#globalSearch')).toBeFocused();
  await page.locator('#globalSearch').fill('Strategie');
  await page.locator('#globalSearch').press('Enter');
  await expect(routeButton(page, 'Strategie')).toHaveClass(/is-active/);
  expect(pageErrors).toEqual([]);
});

test('next portal mobile navigation is task-focused and usable', async ({ page }) => {
  test.setTimeout(45000);
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await isolateProductFromPreviewChrome(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${preview}/portal-next/`, { waitUntil: 'networkidle' });
  await assertMobileReady(page);
  const pageErrors = collectInteractionErrors(page);

  await mobileRouteButton(page, 'Mijn werk').click();
  await expect(page.getByRole('heading', { name: 'Alles wat nu jouw aandacht vraagt', exact: true })).toBeVisible();
  await mobileRouteButton(page, 'Uitvoering').click();
  await expect(page.getByRole('heading', { name: 'Uitvoeren met bewijs', exact: true })).toBeVisible();
  await mobileRouteButton(page, 'AI').click();
  await expect(page.locator('#aiPrompt')).toBeFocused();
  expect(pageErrors).toEqual([]);
});
