const {test,expect}=require('@playwright/test');

const base=process.env.PREVIEW_URL||process.env.PRODUCTION_URL;
test.describe('One installed Bedrijfsgeheugen app across phone and tablet',()=>{
 test('public phone has one four-target native bottom dock, navigable to original pages',async({page})=>{
  if(!base)test.skip(true,'PREVIEW_URL or PRODUCTION_URL required');
  await page.setViewportSize({width:390,height:844});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  const response=await page.goto(base+'/?bg_app_test=1',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response.status()).toBeLessThan(400);
  const dock=page.locator('[data-bg-app-public-dock]');
  await expect(dock).toBeVisible();
  await expect(dock.locator('a')).toHaveCount(4);
  for(const link of await dock.locator('a').all()){
   const url=await link.getAttribute('href');
   expect(url.startsWith('https://')).toBeTruthy();
   const box=await link.boundingBox();
   expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)).toBeTruthy();
  const manifest=await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifest).toContain('/portal-v2/app.webmanifest');
  const manifestResponse=await page.request.get(new URL(new URL(manifest).pathname,base).toString()); // Verify exact preview-origin asset, not current production release.
  expect(manifestResponse.ok()).toBeTruthy();
  expect((await manifestResponse.json()).start_url).toBe('/portal-v2/');
  expect(errors).toEqual([]);
 });
 test('original four-action portal dock becomes tablet native, without duplicate hamburger or tenant data',async({page})=>{
  if(!base)test.skip(true,'PREVIEW_URL or PRODUCTION_URL required');
  await page.setViewportSize({width:820,height:1180});
  const response=await page.goto(base+'/portal-v2/?bg_app_test=1',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response.status()).toBeLessThan(400);
  const dock=page.locator('[data-portal-mobile-primary]');
  await expect(dock).toBeVisible();
  await expect(dock.locator('button')).toHaveCount(4);
  await expect(page.locator('.portal-hamburger')).toBeHidden();
  const action=page.locator('[data-mobile-primary-target="hub:portal"]');
  const box=await action.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  const main=await page.locator('main.main').boundingBox();
  expect(main.width).toBeGreaterThan(400);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)).toBeTruthy();
  await action.click();
  await expect(page.locator('#allPages')).toBeVisible();
  await page.locator('#closePages').click();
  await expect(page.locator('#allPages')).toBeHidden();
 });
 test('iPad 1024px has one authorized four-tab dock and never a duplicate legacy sidebar',async({page})=>{
  if(!base)test.skip(true,'PREVIEW_URL or PRODUCTION_URL required');
  await page.setViewportSize({width:1024,height:1366});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  const response=await page.goto(base+'/portal-v2/?bg_app_ipad=1024',{waitUntil:'domcontentloaded',timeout:45000});
  expect(response.status()).toBeLessThan(400);
  const dock=page.locator('[data-portal-mobile-primary]');
  await expect(dock).toBeVisible();
  await expect(dock.locator('button')).toHaveCount(4);
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.portal-hamburger')).toBeHidden();
  const width=await page.locator('main.main').evaluate(node=>node.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(900);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBeTruthy();
  const more=page.locator('[data-mobile-primary-target="hub:portal"]');
  const hit=await more.boundingBox();expect(hit.height).toBeGreaterThanOrEqual(44);
  await more.click();
  await expect(page.locator('#allPages')).toBeVisible();
  await page.locator('#closePages').click();
  await expect(page.locator('#allPages')).toBeHidden();
  expect(errors).toEqual([]);
 });

});
