const { test, expect } = require('@playwright/test');

const PAGES=['data-ai','ai-scan','businesscase','cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','ai-capabilities','strategie-naar-maandagochtend','canvassen','eindconclusie','due-diligence','actueel-houden','wijzigingen','advies','offerte','roadmap'];

test.describe.configure({timeout:120000});

async function hideNetlifyChrome(page){
 await page.route('**/cdp/**',route=>route.abort());
 await page.addInitScript(()=>{const style=document.createElement('style');style.textContent='iframe[title="Netlify Drawer"],[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}';const attach=()=>document.documentElement?.appendChild(style);if(document.documentElement)attach();else document.addEventListener('DOMContentLoaded',attach,{once:true});});
}
async function boot(page,preview,width=1440,height=1000){
 await page.setViewportSize({width,height});
 const response=await page.goto(`${preview}/portal-v2/?bg_preview=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
 expect(response,'portal preview response').not.toBeNull();
 expect(response.status(),'portal preview status').toBeLessThan(400);
 await expect(page.getByRole('heading',{name:'Welkom terug, Arthur',exact:true})).toBeVisible({timeout:30000});
 await page.waitForFunction(()=>Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__)&&Boolean(document.querySelector('[data-mobile-nav="overview"]')),{timeout:30000});
}
async function openFunctional(page,pageId){
 await page.evaluate(async id=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage(id);},pageId);
 await expect(page.locator('#portalView')).toHaveClass(/open/,{timeout:10000});
 await expect(page.locator(`[data-functional-workspace="${pageId}"]`)).toBeVisible({timeout:10000});
}

test('all remaining protected legacy capabilities open as native editable V2 workspaces',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await hideNetlifyChrome(page);await boot(page,preview);
 for(const pageId of PAGES){
  await openFunctional(page,pageId);
  await expect(page.locator('#portalView')).toHaveAttribute('data-page-id',pageId);
  const workspace=page.locator(`[data-functional-workspace="${pageId}"]`);
  await expect(workspace.locator('[data-workspace-tab]')).toHaveCount(4);
  expect(await workspace.locator('input,select,textarea,[data-repeat-add]').count(),`${pageId} must be editable`).toBeGreaterThan(0);
  expect(await workspace.locator('a[href*="klantportaal"],iframe[src*="klantportaal"]').count(),`${pageId} must not use legacy runtime`).toBe(0);
 }
});

test('functional workspaces remain touch-safe and overflow-free at supported phone widths',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await hideNetlifyChrome(page);await boot(page,preview,320,720);
 for(const [width,height] of [[320,720],[390,844],[430,932]]){
  await page.setViewportSize({width,height});
  for(const pageId of ['ai-scan','cijfers-maatstaven','compliance-governance','canvassen','due-diligence','roadmap']){
   await openFunctional(page,pageId);
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
 await hideNetlifyChrome(page);await boot(page,preview,390,844);await openFunctional(page,'roadmap');
 const workspace=page.locator('[data-functional-workspace="roadmap"]');
 await workspace.locator('[data-repeat-add]').click();
 await expect(workspace.locator('[data-repeat-row]')).toHaveCount(1);
 const title=workspace.locator('[data-repeat-row] [data-repeat-col="title"]');
 await title.fill('Borg kritieke kennis');await title.blur();await expect(title).toHaveValue('Borg kritieke kennis');
 await workspace.locator('[data-workspace-tab="analyse"]').click();
 const itemsCard=workspace.getByRole('article').filter({has:workspace.getByText('Items',{exact:true})});
 await expect(itemsCard).toHaveCount(1);
 await expect(itemsCard.getByText('Items',{exact:true})).toBeVisible();
 await expect(itemsCard.getByText('1',{exact:true})).toBeVisible();
});

test('roadmap cards move between sprints with drag on desktop and 44px controls on mobile',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await hideNetlifyChrome(page);await boot(page,preview,1440,1000);await openFunctional(page,'roadmap');
 let workspace=page.locator('[data-functional-workspace="roadmap"]');
 await workspace.locator('[data-repeat-add]').click();
 const card=workspace.locator('[data-repeat-row]').first();
 await expect(card).toHaveAttribute('data-sprint','1');
 await card.dragTo(workspace.locator('.v2roadmapdrop[data-sprint="3"]'));
 await expect(workspace.locator('.v2roadmapdrop[data-sprint="3"] [data-repeat-row]')).toHaveCount(1);

 await page.setViewportSize({width:390,height:844});
 workspace=page.locator('[data-functional-workspace="roadmap"]');
 const moveRight=workspace.locator('.v2roadmapdrop[data-sprint="3"] [data-move-right]').first();
 const box=await moveRight.boundingBox();expect(box).toBeTruthy();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);
 await moveRight.click();
 await expect(workspace.locator('.v2roadmapdrop[data-sprint="4"] [data-repeat-row]')).toHaveCount(1);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow).toBeLessThanOrEqual(1);
});