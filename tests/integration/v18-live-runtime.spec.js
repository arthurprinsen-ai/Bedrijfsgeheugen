const { test, expect } = require('@playwright/test');

const previewUrl = process.env.PREVIEW_URL;
if (!previewUrl) throw new Error('PREVIEW_URL is required');

async function openV18(page, width = 1440, height = 1000) {
  await page.setViewportSize({ width, height });
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  expect(await page.evaluate(() => window.__BG_PRODUCTION_VERSION__ || null)).toBe('V18.8');
}

test('V18.8 production runtime is indexable and uses accepted hero media', async ({ page }) => {
  await openV18(page);
  await expect(page.locator('#heroBackgroundVideo')).toHaveCount(1);
  const head = (await page.locator('head').innerHTML()).toLowerCase();
  expect(head).not.toContain('noindex');
  expect(head).not.toContain('nofollow');
  expect(head).toContain('https://bedrijfsgeheugen.nl/');
});

test('desktop mega menus expose reliable open and close state', async ({ page }) => {
  await openV18(page);
  const solutionsItem = page.locator('.navitem[data-mega]').filter({ has: page.locator('.v17-solutions-mega') });
  const solutions = solutionsItem.locator(':scope > .navbtn');
  const solutionsMega = solutionsItem.locator(':scope > .mega');
  const moreItem = page.locator('.navitem[data-mega]').filter({ has: page.locator('#v17MoreMega') });
  const more = moreItem.locator(':scope > .navbtn');

  await expect(solutions).toHaveAttribute('aria-expanded', 'false');
  await expect(solutions).toHaveAttribute('aria-haspopup', 'true');
  await solutions.click();
  await expect(solutions).toHaveAttribute('aria-expanded', 'true');
  await expect(solutionsMega).toBeVisible();
  await solutions.click();
  await expect(solutions).toHaveAttribute('aria-expanded', 'false');
  await expect(solutionsMega).toBeHidden();

  await solutions.click();
  await more.click();
  await expect(solutions).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
});

test('mobile drawer open and close state stays synchronized', async ({ page }) => {
  await openV18(page, 390, 844);
  const toggle = page.locator('#mobileToggle');
  const drawer = page.locator('#v18MobileDrawer');
  const close = page.locator('#v18MobileClose');

  await expect(toggle).toHaveAttribute('aria-controls', 'v18MobileDrawer');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await expect(drawer).toBeVisible();
  await close.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
});
