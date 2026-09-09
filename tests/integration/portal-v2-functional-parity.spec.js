const { test, expect } = require('@playwright/test');

const PAGES=['data-ai','ai-scan','businesscase','cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','ai-capabilities','strategie-naar-maandagochtend','canvassen','eindconclusie','due-diligence','actueel-houden','wijzigingen','advies','offerte','roadmap'];

async function hideNetlifyChrome(page){
 await page.route('**/cdp/**',route=>route.abort());
 await page.addInitScript(()=>{const style=document.createElement('style');style.textContent='iframe[title="Netlify Drawer"],[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}';document.addEventListener('DOMContentLoaded',()=>document.documentElement.appendChild(style),{once:true});});
}

async function openFunctional(page,preview,pageId,width=1440,height=1000){
 await page.setViewportSize({width,height});
 await page.goto(`${preview}/portal-v2/?page=${encodeURIComponent(pageId)}`,{waitUntil:'domcontentloaded'});
 await expect(page.locator('#portalView')).toHaveClass(/open/,{timeout:30000});
 await expect(page.locator(`[data-functional-workspace="${pageId}"]`)).toBeVisible({timeout:30000});
}

test('all remaining protected legacy capabilities open as native editable V2 workspaces',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await hideNetlifyChrome(page);
 for(const pageId of PAGES){
  await openFunctional(page,preview,pageId);
  await expect(page.locator('#portalView')).toHaveAttribute('data-page-id',pageId);
  await expect(page.locator(`[data-functional-workspace="${pageId}"] [data-workspace-tab]`)).toHaveCount(4);
  const editable=page.locator(`[data-functional-workspace="${pageId}"] input, [data-functional-workspace="${pageId}"] select, [data-functional-workspace="${pageId}"] textarea, [data-functional-workspace="${pageId}"] [data-repeat-add]`);
  expect(await editable.count(),`${pageId} must be editable`).toBeGreaterThan(0);
  const legacyRuntime=await page.locator(`[data-functional-workspace="${pageId}"] a[href*="klantportaal"], [data-functional-workspace="${pageId}"] iframe[src*="klantportaal"]`).count();
  expect(legacyRuntime,`${pageId} must not use legacy runtime`).toBe(0);
 }
});

test('functional workspaces remain touch-safe and overflow-free at supported phone widths',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await hideNetlifyChrome(page);
 for(const [width,height] of [[320,720],[390,844],[430,932]]){
  for(const pageId of ['ai-scan','cijfers-maatstaven','compliance-governance','canvassen','due-diligence','roadmap']){
   await openFunctional(page,preview,pageId,width,height);
   const workspace=page.locator(`[data-functional-workspace="${pageId}"]`);
   const firstControl=workspace.locator('input,select,textarea,button').first();
   const box=await firstControl.boundingBox();expect(box,`${pageId}@${width}`).toBeTruthy();expect(box.height).toBeGreaterThanOrEqual(44);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(overflow,`${pageId}@${width} overflow`).toBeLessThanOrEqual(1);
  }
 }
});

test('repeatable legacy collections add and edit native V2 rows without navigation fallback',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await hideNetlifyChrome(page);
 await openFunctional(page,preview,'roadmap',390,844);
 const workspace=page.locator('[data-functional-workspace="roadmap"]');
 await workspace.locator('[data-repeat-add]').click();
 await expect(workspace.locator('[data-repeat-row]')).toHaveCount(1);
 const title=workspace.locator('[data-repeat-row] [data-repeat-col="title"]');
 await title.fill('Borg kritieke kennis');
 await expect(title).toHaveValue('Borg kritieke kennis');
 await workspace.locator('[data-workspace-tab="analyse"]').click();
 await expect(workspace.getByText('Items',{exact:true})).toBeVisible();
 await expect(workspace.getByText('1',{exact:true})).toBeVisible();
});
