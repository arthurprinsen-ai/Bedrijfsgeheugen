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
  await solutions.click();
  await expect(solutions).toHaveAttribute('aria-expanded', 'true');
  await expect(solutionsMega).toBeVisible();
  await solutions.click();
  await expect(solutionsMega).toBeHidden();
  await solutions.click();
  await more.click();
  await expect(solutions).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
});

test('homepage mobile menu remains usable', async ({ page }) => {
  await openV18(page, 390, 844);
  const toggle = page.locator('#mobileToggle');
  const menuLabel = toggle.locator('.bg-mobile-menu-label');
  const nav = page.locator('#bgMobileNav');
  await expect(menuLabel).toHaveText('Menu');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(menuLabel).toHaveText('Sluit');
  await expect(nav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('over-ons preview is the accepted test-environment mission and belief page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${previewUrl}/over-ons`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1, name: 'Een bedrijf hoort niet afhankelijk te zijn van wat mensen toevallig onthouden.' })).toBeVisible();
  await expect(main.getByText('Ons geloof: technologie moet mensen tijd teruggeven, context zichtbaar maken en de organisatie sterker maken.', { exact: true })).toBeVisible();
  await expect(main.getByText('Ons verhaal', { exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'De kennis was er wel. Alleen niet als één geheel.' })).toBeVisible();
  await expect(main.getByText('Onze missie', { exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Van chaos naar grip en controle.' })).toBeVisible();
  for (const name of ['Samenhang','Continuïteit','Ruimte','Betrouwbare AI']) await expect(main.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Geen callcenter.', { exact: true })).toHaveCount(0);
});

test('all accepted test-environment views resolve as real production routes', async ({ page }) => {
  const checks = [
    ['/problemen', 'Waar organisaties tijd, kennis en controle verliezen.'],
    ['/oplossingen', 'Organisatie, automatisering, data en AI in samenhang.'],
    ['/prijzen', 'Meer regie naarmate je groeit.'],
    ['/cases', 'Van vastlopen naar werkend.'],
    ['/kennis', 'Vraag, lees en vertaal kennis naar je eigen bedrijf.'],
    ['/inloggen', 'Open je Bedrijfsgeheugen.'],
    ['/aanmelden', 'Start met je bedrijfscontext.']
  ];
  for (const [route, heading] of checks) {
    const response = await page.goto(`${previewUrl}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response && response.ok(), `${route} should return HTTP success`).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
});

test('recovered pages use the current V18 responsive mobile drilldown', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${previewUrl}/problemen`, { waitUntil: 'domcontentloaded' });
  const toggle = page.getByRole('button', { name: 'Open menu' });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-label', 'Sluit menu');
  await expect(toggle.locator('.bg-mobile-menu-label')).toHaveText('Sluit');
  const nav = page.locator('#bgSharedMobileNav');
  await expect(nav).toHaveAttribute('aria-hidden', 'false');
  await nav.getByRole('button', { name: 'Meer' }).click();
  await expect(nav.getByRole('link', { name: 'Over ons' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle.locator('.bg-mobile-menu-label')).toHaveText('Menu');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
