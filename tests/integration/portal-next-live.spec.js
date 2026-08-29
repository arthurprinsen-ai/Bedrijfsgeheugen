const { test, expect } = require('@playwright/test');

const ROUTES = ['Strategie','Groei','Operatie','Organisatie','Data & Technologie','Uitvoering','Mijn werk','Model Library','Trust & Governance','Beheer'];

test('next portal desktop navigation, drawers and command route work on live preview', async ({ page }) => {
  test.setTimeout(45000);
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.goto(`${preview}/portal-next/`, { waitUntil: 'networkidle' });
  await expect(page.getByText('AI Management Summary')).toBeVisible();

  for (const route of ROUTES) {
    await page.locator('.sidebar button', { hasText: route }).click();
    await expect(page.locator('.sidebar button', { hasText: route })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.workspace-hero h1')).toBeVisible();
  }

  await page.locator('.sidebar button', { hasText: 'Trust & Governance' }).click();
  await expect(page.getByText('AI Register')).toBeVisible();
  await expect(page.getByText('Agent Team')).toBeVisible();
  await expect(page.getByText('Access Center')).toBeVisible();

  await page.getByRole('button', { name: /Waarom deze toegang/i }).click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawer')).not.toHaveClass(/open/);

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await expect(page.locator('#command')).toBeFocused();
  await page.locator('#command').fill('Strategie');
  await page.locator('#command').press('Enter');
  await expect(page.locator('.sidebar button', { hasText: 'Strategie' })).toHaveAttribute('aria-current', 'page');
  expect(pageErrors).toEqual([]);
});

test('next portal mobile navigation is task-focused and usable', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${preview}/portal-next/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await page.locator('.mobile-nav button', { hasText: 'Werk' }).click();
  await expect(page.getByText('Eén persoonlijke inbox uit de hele Company Graph')).toBeVisible();
  await page.locator('.mobile-nav button', { hasText: 'Changes' }).click();
  await expect(page.getByText('Van besluit naar geverifieerde impact')).toBeVisible();
  await page.locator('.mobile-nav button', { hasText: 'AI' }).click();
  await expect(page.locator('#command')).toBeFocused();
});
