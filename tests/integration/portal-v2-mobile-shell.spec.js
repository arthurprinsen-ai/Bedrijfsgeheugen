const { test, expect } = require('@playwright/test');

test.describe.configure({ timeout: 120000 });

test('demoAI stays compact after asynchronous Portal V2 hydration', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || String(error)));

  const response = await page.goto(`${preview}/klantportaal?klant=demoAI&bg_live=${Date.now()}`, {
    waitUntil: 'domcontentloaded', timeout: 45000
  });
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await page.waitForSelector('.app');
  await page.waitForSelector('.v2utilities', { state: 'attached' });
  await page.waitForTimeout(1800);

  // Preserve the fully hydrated browser state on every run, including failures.
  await page.screenshot({ path: 'artifacts/portal-v2-mobile-overview-demoai.png', fullPage: true });

  // Original mobile UX is a single task-oriented four-tab dock. Verify the
  // real "Meer" control instead of the intentionally hidden legacy hamburger.
  const mobileMore=page.locator('[data-portal-mobile-primary] [data-mobile-primary-target="hub:portal"]');
  await expect(mobileMore).toBeVisible();
  const moreBox=await mobileMore.boundingBox();
  expect(moreBox?.height||0,'mobile Meer needs >=44px touch target').toBeGreaterThanOrEqual(44);
  await expect(page.locator('#portalFullMenuToggle')).toBeHidden();
  await mobileMore.click();
  await expect(page.locator('#allPages')).toBeVisible();
  await expect(page.locator('#allPages')).toHaveAttribute('data-hub','portal');
  await expect(mobileMore).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#closePages')).toBeFocused();
  await expect(page.locator('.app')).toHaveJSProperty('inert',true);
  // Shift+Tab from the first menu action wraps to the last menu action,
  // rather than letting keyboard users reach the hidden customer dashboard.
  const lastMenuAction=page.locator('#allPages .groups button:visible').last();
  await page.keyboard.press('Shift+Tab');
  await expect(lastMenuAction).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#closePages')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#allPages')).toBeHidden();
  await expect(mobileMore).toBeFocused();
  await expect(mobileMore).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('.app')).toHaveJSProperty('inert',false);

  // Dismissing More preserves the previous canonical content route.
  await page.evaluate(async()=>{
    const {navigatePortal}=await import('/portal-v2/router.js');
    navigatePortal('roadmap');
  });
  const previousUrl=page.url();
  // Use the canonical router: a specialist page can cover the dock visually.
  await page.evaluate(async()=>{
    const {navigatePortal}=await import('/portal-v2/router.js');
    navigatePortal('hub:portal');
  });
  await expect(page.locator('#allPages')).toBeVisible();
  await page.locator('#closePages').click();
  await expect(page.locator('#allPages')).toBeHidden();
  await expect(page).toHaveURL(previousUrl);
  await expect(page.locator('.mobilebar')).toHaveCount(0);
  await expect(page.locator('.v2utilities')).toBeHidden();
  await expect(page.locator('.v2globalstatus')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeHidden();

  const searchGeometry = await page.locator('.searchrow > *').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height };
  }).filter(item => item.width > 0 && item.height > 0));
  expect(searchGeometry).toHaveLength(4);
  expect(Math.max(...searchGeometry.map(x => x.y)) - Math.min(...searchGeometry.map(x => x.y))).toBeLessThanOrEqual(2);
  expect(searchGeometry[0].width).toBeGreaterThan(180);
  expect(searchGeometry.slice(1).every(item => item.width >= 40 && item.width <= 48 && item.height >= 40 && item.height <= 48)).toBeTruthy();

  const topbarHeight = await page.locator('.topbar').evaluate(node => node.getBoundingClientRect().height);
  expect(topbarHeight).toBeLessThan(260);

  const actionGeometry = await page.locator('.actionrow > .smallbtn').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { width:r.width, height:r.height };
  }).filter(item => item.width > 0 && item.height > 0));
  expect(actionGeometry).toHaveLength(1);
  expect(actionGeometry[0].height).toBeGreaterThanOrEqual(40);
  expect(actionGeometry[0].height).toBeLessThanOrEqual(48);

  // Periode is intentionally a real selector, not a fake button.
  const period = page.locator('#portalPeriod');
  await expect(period).toBeVisible();
  await expect(period).toHaveValue('2025-05');

  // The authenticated/customer cockpit may intentionally replace the static KPI strip.
  // The regression contract is layout stability, not preservation of pre-hydration demo content.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
