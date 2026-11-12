const {test,expect}=require('@playwright/test');

test.describe.configure({timeout:120000});

test('iPad-width original Portal V2 uses one canonical app dock, safe navigation and no desktop sidebar',async({page})=>{
 const preview=process.env.PREVIEW_URL;
 if(!preview)throw new Error('PREVIEW_URL is required');
 await page.setViewportSize({width:820,height:1180});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 const response=await page.goto(preview+'/klantportaal?klant=demoAI&bg_tablet=20261112',{
  waitUntil:'domcontentloaded',timeout:45000
 });
 expect(response?.status()).toBeLessThan(400);
 const dock=page.locator('[data-portal-mobile-primary]');
 await expect(dock).toBeVisible();
 await expect(page.locator('.sidebar')).toBeHidden();
 await expect(page.locator('.portal-hamburger')).toBeHidden();
 await expect(dock.locator('button')).toHaveCount(4);
 const geometry=await dock.locator('button').evaluateAll(nodes=>nodes.map(node=>{
  const r=node.getBoundingClientRect();
  return {height:r.height,width:r.width,visible:r.width>0&&r.height>0};
 }));
 expect(geometry.every(item=>item.visible&&item.height>=44),'tablet action controls should be tap-size').toBeTruthy();
 const more=dock.locator('[data-mobile-primary-target="hub:portal"]');
 await more.click();
 await expect(page.locator('#allPages')).toBeVisible();
 await expect(more).toHaveAttribute('aria-expanded','true');
 await page.locator('#closePages').click();
 await expect(page.locator('#allPages')).toBeHidden();
 const actions=dock.locator('[data-mobile-primary-target="actieve-acties"]');
 await actions.click();
 await expect(page).toHaveURL(/page=actieve-acties/);
 await expect(actions).toHaveAttribute('aria-current','page');
 const mainBounds=await page.locator('main.main').evaluate(node=>({
  left:node.getBoundingClientRect().left,right:node.getBoundingClientRect().right
 }));
 expect(mainBounds.left).toBeGreaterThanOrEqual(-1);
 expect(mainBounds.right).toBeLessThanOrEqual(821);
 expect(errors).toEqual([]);
});
