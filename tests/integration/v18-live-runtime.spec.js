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

test('mobile uses white Menu pill and accepted Meer drilldown navigation', async ({ page }) => {
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
  await expect(root.getByRole('button', { name: 'Meer' })).toBeVisible();
  await expect(root.getByRole('link', { name: 'Over ons' })).toHaveCount(0);

  await root.getByRole('button', { name: 'Meer' }).click();
  const more = nav.locator('[data-bg-mobile-view="meer"]');
  await expect(root).toBeHidden();
  await expect(more).toBeVisible();
  await expect(more.getByRole('heading', { name: 'Meer' })).toBeVisible();
  await expect(more.getByRole('link', { name: 'Alle expertises' })).toBeVisible();
  await expect(more.getByRole('link', { name: 'Over ons' })).toBeVisible();
  await more.getByRole('button', { name: 'Terug' }).click();
  await expect(root).toBeVisible();

  await root.getByRole('button', { name: 'Koppelingen' }).click();
  const integrations = nav.locator('[data-bg-mobile-view="koppelingen"]');
  await expect(root).toBeHidden();
  await expect(integrations).toBeVisible();
  await expect(integrations.getByRole('heading', { name: 'Koppelingen' })).toBeVisible();
  await expect(integrations.getByRole('link', { name: 'AFAS-koppeling' })).toBeVisible();
  await integrations.getByRole('button', { name: 'Terug' }).click();
  await expect(root).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toHaveAttribute('aria-hidden', 'true');
});

test('over-ons preview restores accepted mission ambition belief and story', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${previewUrl}/over-ons`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  await expect(page.getByRole('heading', { level: 1, name: 'Eerst kijken hoe het werk écht loopt. Dan pas techniek.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'De kennis van je bedrijf moet van het bedrijf zijn.' })).toBeVisible();
  await expect(page.getByText('Onze missie', { exact: true })).toBeVisible();
  await expect(page.getByText('Onze ambitie', { exact: true })).toBeVisible();
  await expect(page.getByText('Ons geloof', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Praktiseren wat je preekt.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gewone taal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Geen big bang' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Van jou, niet van mij' })).toBeVisible();
  await expect(page.getByText('Geen callcenter.', { exact: true })).toHaveCount(0);

  const toggle = page.locator('#bgkopKnop');
  const nav = page.locator('#bgSharedMobileNav');
  await expect(toggle.locator('.bg-mobile-menu-label')).toHaveText('Menu');
  await expect(toggle).toHaveAttribute('aria-controls', 'bgSharedMobileNav');
  await toggle.click();
  await expect(nav).toHaveAttribute('aria-hidden', 'false');
  await expect(nav).toBeVisible();

  const root = nav.locator('[data-bg-shared-mobile-view="root"]');
  await expect(root.getByRole('button', { name: 'Oplossingen' })).toBeVisible();
  await expect(root.getByRole('button', { name: 'Bedrijfsgeheugen' })).toBeVisible();
  await expect(root.getByRole('button', { name: 'Koppelingen' })).toBeVisible();
  await expect(root.getByRole('button', { name: 'Kennis' })).toBeVisible();
  await expect(root.getByRole('button', { name: 'Meer' })).toBeVisible();

  await root.getByRole('button', { name: 'Meer' }).click();
  const more = nav.locator('[data-bg-shared-mobile-view="meer"]');
  await expect(more).toBeVisible();
  await expect(more.getByRole('link', { name: 'Alle expertises' })).toBeVisible();
  await expect(more.getByRole('link', { name: 'Over ons' })).toBeVisible();
  await more.getByRole('button', { name: 'Terug' }).click();
  await expect(root).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(nav).toHaveAttribute('aria-hidden', 'true');
});
