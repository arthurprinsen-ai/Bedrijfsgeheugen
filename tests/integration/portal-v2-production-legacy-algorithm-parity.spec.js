import { test, expect } from '@playwright/test';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';

async function openAnalysis(page,pageId){
 const response=await page.goto(`${BASE_URL}/portal-v2/?page=${encodeURIComponent(pageId)}&bg_algorithm_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
 expect(response,`${pageId} response`).not.toBeNull();
 expect(response.status(),`${pageId} status`).toBeLessThan(400);
 const workspaceSelector=`[data-functional-workspace="${pageId}"]`;
 const workspace=page.locator(workspaceSelector);
 await expect(workspace,`${pageId} workspace`).toBeVisible({timeout:15_000});
 // The first generic workspace shell is synchronous; functional-suite and
 // specialist workspaces replace/fill it asynchronously. Generic functional
 // pages all expose their final tenant-scoped save actions only after the
 // delegated form renderer has mounted; Roadmap has its own board marker.
 const readySelector=pageId==='roadmap'?'[data-roadmap-board]':'.v2formactions';
 await expect(workspace.locator(readySelector).first(),`${pageId} final workspace`).toBeVisible({timeout:15_000});
 const parity=page.locator(`${workspaceSelector} [data-legacy-algorithm-parity]`);
 // attachLegacyAlgorithmParity is imported after the final workspace mount.
 // Re-applying the idempotent Analyse selection avoids losing the click in the
 // small interval between final form render and parity-listener attachment.
 await expect.poll(async()=>{
   const tab=page.locator(`${workspaceSelector} [data-workspace-tab="analyse"]`);
   if(!await tab.count())return false;
   await tab.click();
   return parity.isVisible().catch(()=>false);
 },{timeout:15_000,intervals:[100,200,400,800]}).toBe(true);
 await expect(parity,`${pageId} executable parity evidence`).toBeVisible();
 return parity;
}

test('production serves the executable legacy parity engine',async({request})=>{
 const response=await request.get(`${BASE_URL}/portal-v2/legacy-parity-engine.js?bg_engine=${Date.now()}`);
 expect(response.status()).toBeLessThan(400);
 const source=await response.text();
 expect(source).toContain('calculateLegacyEquivalent');
 expect(source).toContain('LEGACY_PARITY_ENGINE_VERSION');
});

test('production executes representative AI, finance, compliance and execution legacy calculations inside V2',async({page})=>{
 test.setTimeout(120_000);
 for(const [pageId,ids] of [
  ['ai-scan',['annual-task-cost','opportunity-score']],
  ['waarde-financiering',['dcf','altman-z','dscr']],
  ['compliance-governance',['compliance-risk']],
  ['strategie-naar-maandagochtend',['priority-filter']],
  ['due-diligence',['red-flags']],
  ['advies',['cross-model-weight']],
  ['roadmap',['roadmap-value']]
 ]){
  const parity=await openAnalysis(page,pageId);
  for(const id of ids)await expect(parity.getByText(id,{exact:true}),`${pageId}:${id}`).toBeVisible();
 }
});
