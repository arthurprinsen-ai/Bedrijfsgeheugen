const { test, expect } = require('@playwright/test');

test.describe.configure({ timeout: 120000 });

test('entrepreneur first screen contains one decision route and keeps late modules in accessible detail', async ({ page }) => {
  const origin=process.env.PRODUCTION_URL||process.env.PREVIEW_URL;
  if(!origin) throw new Error('PRODUCTION_URL or PREVIEW_URL required for genuine provider browser proof');
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error.message||error)));
  await page.setViewportSize({width:390,height:844});
  const response=await page.goto(origin.replace(/\/$/,'')+'/portal-v2/?ux_depth_check='+Date.now(),{
    waitUntil:'domcontentloaded',timeout:45000,
  });
  expect(response?.status()).toBeLessThan(400);
  const first=page.locator('[data-entrepreneur-home]');
  await expect(first).toBeVisible({timeout:20000});
  const depth=page.locator('details[data-portal-overview-depth]');
  await expect(depth).toHaveCount(1);
  await expect(depth).not.toHaveAttribute('open');
  const accounting=page.locator('[data-management-accounting-intelligence]');
  const foresight=page.locator('[data-foresight-context][data-page="overzicht"]');
  await expect(accounting).toHaveCount(1,{timeout:30000});
  await expect(foresight).toHaveCount(1,{timeout:30000});
  expect(await accounting.evaluate(n=>n.closest('details[data-portal-overview-depth]')!==null)).toBe(true);
  expect(await foresight.evaluate(n=>n.closest('details[data-portal-overview-depth]')!==null)).toBe(true);
  await expect(accounting).toBeHidden();
  await expect(foresight).toBeHidden();
  // The original important next action stays outside the details.
  await expect(first.locator('.eh-main-action')).toHaveCount(1);
  await expect(first.locator('.eh-main-action')).toBeVisible();
  await page.screenshot({path:'artifacts/portal-v2-entrepreneur-focus-390.png',fullPage:false});

  const summary=depth.locator('summary').first();
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(depth).toHaveAttribute('open','');
  await expect(accounting).toBeVisible();
  await expect(foresight).toBeVisible();
  await expect(accounting.getByText('Nog nodig voor een rijker beeld:')).toHaveCount(0); // partial text may be extended
  await summary.click();
  await expect(depth).not.toHaveAttribute('open');
  await page.setViewportSize({width:1440,height:900});
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  expect(dimensions.scroll-dimensions.viewport).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});