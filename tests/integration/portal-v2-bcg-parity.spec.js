const { test, expect } = require('@playwright/test');

test.describe.configure({timeout:120000});

async function boot(page,preview){
  await page.route('**/cdp/**',route=>route.abort());
  const response=await page.goto(`${preview}/portal-v2/?bg_bcg=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await page.waitForFunction(()=>Boolean(document.querySelector('.app'))&&Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__),{timeout:30000});
}

test('BCG opens natively in Portal V2 with all four structural quadrants and no invented values',async({page})=>{
  const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
  await boot(page,preview);
  await page.evaluate(async()=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage('model-bcg');});
  const view=page.locator('#portalView');
  await expect(view).toHaveClass(/open/);
  await expect(view.locator('#pvTitle')).toContainText('BCG-matrix');
  for(const label of ['Sterren','Cash cows','Vraagtekens','Dogs']) await expect(view.getByText(label,{exact:true})).toBeVisible();
  await expect(view.getByText('Nog geen portfolio-data',{exact:true})).toBeVisible();
  await expect(view).toContainText('geen voorbeeldposities of verzonnen cijfers');
  expect(await view.locator('a[href*="klantportaal"],iframe[src*="klantportaal"]').count()).toBe(0);
});
