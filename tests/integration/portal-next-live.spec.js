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

function exactButton(page, scope, name) {
  return page.locator(scope).getByRole('button', { name, exact: true });
}

function collectInteractionErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || String(error)));
  return errors;
}

async function assertDesktopReady(page) {
  await expect(page.getByText('AI Management Summary')).toBeVisible();
  await expect(exactButton(page, '.sidebar', 'Overzicht')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#command')).toBeVisible();
}

async function assertMobileReady(page) {
  await expect(page.getByText('AI Management Summary')).toBeVisible();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await expect(exactButton(page, '.mobile-nav', 'Home')).toBeVisible();
  await expect(page.locator('#command')).toBeVisible();
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
    const button = exactButton(page, '.sidebar', route);
    await button.click();
    await expect(page.locator('.workspace-hero h1')).toBeVisible();
    await expect(button).toHaveAttribute('aria-current', 'page');
  }

  await exactButton(page, '.sidebar', 'Trust & Governance').click();
  await expect(page.getByRole('heading', { name: 'AI Register', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agent Team', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Access Center', exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Waarom deze toegang/i }).click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer')).not.toHaveClass(/open/);

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await expect(page.locator('#command')).toBeFocused();
  await page.locator('#command').fill('Strategie');
  await page.locator('#command').press('Enter');
  await expect(exactButton(page, '.sidebar', 'Strategie')).toHaveAttribute('aria-current', 'page');
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

  await exactButton(page, '.mobile-nav', 'Werk').click();
  await expect(page.getByText('Eén persoonlijke inbox uit de hele Company Graph')).toBeVisible();
  await exactButton(page, '.mobile-nav', 'Changes').click();
  await expect(page.getByText('Van besluit naar geverifieerde impact')).toBeVisible();
  await exactButton(page, '.mobile-nav', 'AI').click();
  await expect(page.locator('#command')).toBeFocused();
  expect(pageErrors).toEqual([]);
});
