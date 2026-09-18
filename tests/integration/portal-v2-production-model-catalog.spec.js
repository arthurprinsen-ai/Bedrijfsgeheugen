import { test, expect } from '@playwright/test';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';

async function bootDemo(page){
  const response=await page.goto(`${BASE_URL}/klantportaal?klant=demoAI&bg_model_catalog=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
  expect(response).not.toBeNull();
  expect(response.status()).toBeLessThan(400);
  await page.waitForFunction(()=>Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.()),{timeout:30_000});
}

async function open(page,pageId){
  await page.evaluate(async id=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage(id);},pageId);
  const view=page.locator('#portalView');
  await expect(view).toHaveAttribute('data-page-id',pageId,{timeout:10_000});
  await expect(view).toHaveAttribute('aria-hidden','false');
  return view;
}

test('Strategiemodellen opens the specialist catalogue and never falls through to Canvassen',async({page})=>{
  await bootDemo(page);
  const view=await open(page,'strategiemodellen');
  await expect(view.locator('[data-functional-workspace="strategiemodellen"]')).toBeVisible();
  await expect(view.locator('[data-model-catalog] [data-model-jump]')).toHaveCount(20);
  await expect(view.locator('.strategic-model[data-model-id]')).toHaveCount(20);
  await view.locator('[data-model-jump="toc"]').click();
  await expect(view).toHaveAttribute('data-page-id','strategiemodellen');
  await expect(view.locator('[data-model-id="toc"]')).toBeVisible();
});

test('Alle modellen exposes the complete old-portal 20 plus 8 model catalogue',async({page})=>{
  await bootDemo(page);
  const view=await open(page,'modellen');
  await expect(view.locator('[data-functional-workspace="modellen"]')).toBeVisible();
  await expect(view.locator('[data-model-catalog] [data-model-jump]')).toHaveCount(28);
  await expect(view.locator('.strategic-model[data-model-id]')).toHaveCount(28);
  await expect(view.locator('.finance-model[data-model-id]')).toHaveCount(8);
  await expect(view.locator('[data-model-catalog-count]')).toContainText('Alle 28 modellen uit het oude portaal');
  await view.locator('[data-model-jump="dupont"]').click();
  await expect(view).toHaveAttribute('data-page-id','modellen');
  await expect(view.locator('[data-model-id="dupont"]')).toBeVisible();
});
