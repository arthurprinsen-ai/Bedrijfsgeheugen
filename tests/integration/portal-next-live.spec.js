const { test, expect } = require('@playwright/test');

async function isolateProductFromPreviewChrome(page) {
  await page.route('**/cdp/**', route => route.abort());
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'iframe[title="Netlify Drawer"],[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}';
    const attach = () => { if (document.documentElement) document.documentElement.appendChild(style); };
    if (document.documentElement) attach(); else document.addEventListener('DOMContentLoaded', attach, { once:true });
  });
}

function collectInteractionErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || String(error)));
  return errors;
}

async function openDesktopAllPages(page) {
  await page.locator('.portal-all-pages-trigger').click();
  await expect(page.locator('#portalNavigationDrawer')).toHaveClass(/is-open/);
}

async function openMobileMenu(page) {
  await page.locator('#mobileMenuToggle').click();
  await expect(page.locator('#portalMobileDrawer')).toHaveClass(/is-open/);
  await expect(page.locator('#portalMobileNav')).toBeVisible();
}

function nativePageHeading(page, text) {
  return page.locator('#workspaceContent .native-page-hero h2', { hasText: text });
}

function nativeLayerHeading(page, text) {
  return page.locator('#workspaceContent .native-layer h3', { hasText: text });
}

test('complete portal desktop keeps approved overview, all portal pages and Business OS workspaces', async ({ page }) => {
  test.setTimeout(60000);
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await isolateProductFromPreviewChrome(page);
  await page.goto(`${preview}/portal-next/`, { waitUntil: 'networkidle' });
  const pageErrors = collectInteractionErrors(page);

  await expect(page.getByRole('heading', { name: 'AI Management Summary', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar [data-primary-page="overzicht"]')).toHaveClass(/is-active/);
  await expect(page.locator('#overviewView')).toHaveClass(/is-active/);

  await page.locator('.sidebar [data-primary-page="profiel"]').click();
  await expect(nativePageHeading(page, 'Profiel per onderdeel')).toBeVisible();
  await expect(nativeLayerHeading(page, 'Managementbeeld')).toBeVisible();
  await expect(nativeLayerHeading(page, 'Operationele details')).toBeVisible();
  await expect(nativeLayerHeading(page, 'Trace & evidence')).toBeVisible();
  await expect(page.locator('iframe.native-legacy-frame[data-legacy-tab="profiel"]')).toBeVisible();

  await page.locator('[data-native-back]').click();
  await expect(page.locator('#overviewView')).toHaveClass(/is-active/);

  await openDesktopAllPages(page);
  await expect(page.locator('#portalNavigationDrawer [data-portal-page="due-diligence"]')).toBeVisible();
  await expect(page.locator('#portalNavigationDrawer [data-portal-page="learning-writeback"]')).toBeVisible();
  await page.locator('#portalNavigationDrawer [data-business-os-route="Trust & Governance"]').click();
  await expect(page.getByRole('heading', { name: 'AI die bestuurbaar blijft', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'AI Register', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agent Team', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Access Center', exact: true })).toBeVisible();

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await expect(page.locator('#globalSearch')).toBeFocused();
  expect(pageErrors).toEqual([]);
});

test('complete portal mobile has a real hamburger menu with all pages and Business OS routes', async ({ page }) => {
  test.setTimeout(60000);
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await isolateProductFromPreviewChrome(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${preview}/portal-next/`, { waitUntil: 'networkidle' });
  const pageErrors = collectInteractionErrors(page);

  await expect(page.locator('#mobileMenuToggle')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.mobile-nav')).toBeHidden();
  await openMobileMenu(page);
  await expect(page.locator('#portalMobileNav [data-portal-page="ai-scan"]')).toBeVisible();
  await expect(page.locator('#portalMobileNav [data-portal-page="outcomes-evidence"]')).toBeVisible();
  await page.locator('#portalMobileNav [data-portal-page="ai-scan"]').click();
  await expect(nativePageHeading(page, 'AI-scan: kansenkaart')).toBeVisible();
  await expect(page.locator('iframe.native-legacy-frame[data-legacy-tab="aiscan"]')).toBeVisible();

  await openMobileMenu(page);
  await page.locator('#portalMobileNav [data-business-os-route="Mijn werk"]').click();
  await expect(page.getByRole('heading', { name: 'Alles wat nu jouw aandacht vraagt', exact: true })).toBeVisible();

  await page.locator('[data-mobile-ai]').click();
  await expect(page.locator('#aiPrompt')).toBeFocused();
  expect(pageErrors).toEqual([]);
});
