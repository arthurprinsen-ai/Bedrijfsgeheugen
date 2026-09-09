import { test, expect } from '@playwright/test';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';

async function openAnalysis(page,pageId){
 const response=await page.goto(`${BASE_URL}/portal-v2/?page=${encodeURIComponent(pageId)}&bg_algorithm_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
 expect(response,`${pageId} response`).not.toBeNull();
 expect(response.status(),`${pageId} status`).toBeLessThan(400);
 const workspace=page.locator(`[data-functional-workspace="${pageId}"]`);
 await expect(workspace,`${pageId} workspace`).toBeVisible({timeout:15_000});
 await workspace.locator('[data-workspace-tab="analyse"]').click();
 const parity=workspace.locator('[data-legacy-algorithm-parity]');
 await expect(parity,`${pageId} executable parity evidence`).toBeVisible({timeout:10_000});
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
