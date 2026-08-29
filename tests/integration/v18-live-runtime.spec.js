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

test('mobile uses white Menu pill and full-height drilldown navigation', async ({ page }) => {
  await openV18(page, 390, 844);
  const toggle = page.locator('#mobileToggle');
  const menuLabel = toggle.locator('.bg-mobile-menu-label');
  const nav = page.locator('#bgMobileNav');

  await expect(menuLabel).toHaveText('Menu');
  await expect(toggle).toHaveAttribute('aria-controls', 'bgMobileNav');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toHaveAttribute('aria-hidden', 'true');

  const toggleStyle = await toggle.evaluate(el => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { background: s.backgroundColor, radius: s.borderRadius, width: r.width, height: r.height };
  });
  expect(toggleStyle.background).toBe('rgb(255, 255, 255)');
  expect(parseFloat(toggleStyle.radius)).toBeGreaterThanOrEqual(20);
  expect(toggleStyle.width).toBeGreaterThanOrEqual(64);
  expect(toggleStyle.height).toBeGreaterThanOrEqual(44);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menuLabel).toHaveText('Sluit');
  await expect(nav).toHaveAttribute('aria-hidden', 'false');
  await expect(nav).toBeVisible();

  const navBox = await nav.boundingBox();
  expect(navBox.height).toBeGreaterThanOrEqual(800);
  const navBg = await nav.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(navBg).toBe('rgb(255, 255, 255)');

  const root = nav.locator('[data-bg-mobile-view="root"]');
  await expect(root).toBeVisible();
  await expect(root.getByRole('button', { name: 'Oplossingen' })).toBeVisible();
  await expect(root.getByRole('button', { name: 'Bedrijfsgeheugen' })).toBeVisible();
  await expect(root.getByRole('button', { name: 'Koppelingen' })).toBeVisible();
  await expect(root.getByRole('button', { name: 'Kennis' })).toBeVisible();
  await expect(root.getByRole('link', { name: 'Over ons' })).toBeVisible();

  await root.getByRole('button', { name: 'Koppelingen' }).click();
  const integrations = nav.locator('[data-bg-mobile-view="koppelingen"]');
  await expect(root).toBeHidden();
  await expect(integrations).toBeVisible();
  await expect(integrations.getByRole('heading', { name: 'Koppelingen' })).toBeVisible();
  await expect(integrations.getByRole('link', { name: 'AFAS-koppeling' })).toBeVisible();
  await expect(integrations.getByRole('button', { name: 'Terug' })).toBeVisible();

  await integrations.getByRole('button', { name: 'Terug' }).click();
  await expect(root).toBeVisible();
  await expect(integrations).toBeHidden();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toHaveAttribute('aria-hidden', 'true');
});
