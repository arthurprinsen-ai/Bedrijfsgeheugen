import { test, expect } from '@playwright/test';
import { LEGACY_PARITY_ITEMS, GLOBAL_PARITY_CAPABILITIES } from '../../portal-v2/parity-manifest.js';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';
const uniquePages=[...new Set(LEGACY_PARITY_ITEMS.flatMap(item=>item.v2Pages))];

test('all protected legacy workspaces render natively without legacy portal traffic',async({page})=>{
 test.setTimeout(180_000);
 const legacyRequests=[];const pageErrors=[];
 page.on('request',request=>{const url=request.url();if(url.includes('/klantportaal')||url.includes('/portal-next/'))legacyRequests.push(url)});
 page.on('pageerror',error=>pageErrors.push(error.message));
 for(const pageId of uniquePages){
  const response=await page.goto(`${BASE_URL}/portal-v2/?page=${encodeURIComponent(pageId)}&bg_full_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
  expect(response,`${pageId} response`).not.toBeNull();
  expect(response.status(),`${pageId} status`).toBeLessThan(400);
  const view=page.locator('#portalView');
  if(pageId==='overzicht'){
   await expect(page.getByText('Portal V2 bevat alle portalonderdelen standaard',{exact:true}),'overzicht must remain the canonical dashboard').toBeAttached();
   await expect(view).toHaveAttribute('aria-hidden','true');
  }else{
   await expect(view,`${pageId} must open in native V2 view`).toHaveAttribute('data-page-id',pageId,{timeout:10_000});
   await expect(view).toHaveAttribute('aria-hidden','false');
   await expect(view.locator('h1,h2,h3').first(),`${pageId} needs visible native content`).toBeVisible();
  }
  await expect(page.locator('iframe[src*="/klantportaal"],iframe[src*="/portal-next/"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/klantportaal"],a[href*="/portal-next/"]')).toHaveCount(0);
 }
 expect(legacyRequests,'no protected route may request an old portal runtime').toEqual([]);
 expect(pageErrors,'protected V2 routes must have no uncaught browser errors').toEqual([]);
});

test('all global capabilities are native, mobile-safe and fail closed without auth',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const response=await page.goto(`${BASE_URL}/portal-v2/?bg_global_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
 expect(response?.status()).toBeLessThan(400);
 const mobile=page.locator('[data-mobile-nav]');await expect(mobile).toHaveCount(5);
 for(let i=0;i<5;i++){const box=await mobile.nth(i).boundingBox();expect(box?.height||0,`mobile nav ${i}`).toBeGreaterThanOrEqual(44)}
 // Netlify injects a preview-only Drawer iframe that can intercept pointer coordinates.
 // Dispatch through the app-owned element so the test verifies Portal routing, not preview chrome.
 await page.locator('[data-mobile-nav="more"]').evaluate(element=>element.click());
 await expect(page.locator('#allPages')).toHaveAttribute('data-hub','more');
 const expected=['export','import','print-permission','feedback','customer-branding','identity-login-logout'];
 for(const capability of expected){
  const control=page.locator(`[data-mobile-capability="${capability}"]`).first();
  await expect(control,`${capability} must be reachable from More`).toBeVisible();
  const box=await control.boundingBox();expect(box?.height||0,`${capability} touch target`).toBeGreaterThanOrEqual(44);
 }
 await expect(page.locator('[data-capability="identity-login-logout"]')).toBeAttached();
 await page.locator('[data-mobile-capability="feedback"]').click();
 await expect(page.locator('[data-mobile-global-status]')).toContainText('Log in om deze actie veilig uit te voeren.');
 await expect(page.locator('.v2actiondialog')).not.toHaveAttribute('open','');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow,'global controls must not cause horizontal overflow').toBeLessThanOrEqual(1);
 expect(GLOBAL_PARITY_CAPABILITIES.every(item=>item.status==='proven')).toBe(true);
});
