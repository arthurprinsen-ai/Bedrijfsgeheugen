const { test, expect } = require('@playwright/test');

async function boot(page,preview){
 await page.route('**/cdp/**',route=>route.abort());
 await page.goto(`${preview}/portal-v2/`,{waitUntil:'domcontentloaded'});
 await expect(page.getByRole('heading',{name:'Welkom terug, Arthur',exact:true})).toBeVisible({timeout:30000});
 await page.waitForFunction(()=>Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__),{timeout:30000});
}
async function open(page,pageId){
 await page.evaluate(async id=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage(id);},pageId);
 await expect(page.locator(`[data-functional-workspace="${pageId}"]`)).toBeVisible({timeout:15000});
 await page.locator(`[data-functional-workspace="${pageId}"] [data-workspace-tab="analyse"]`).click();
 return page.locator(`[data-functional-workspace="${pageId}"] [data-legacy-algorithm-parity]`);
}

test('legacy financial and AI algorithms execute inside native V2 workspaces',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await boot(page,preview);
 let parity=await open(page,'ai-scan');
 await expect(parity).toBeVisible();
 await expect(parity.getByText('annual-task-cost',{exact:true})).toBeVisible();
 await expect(parity.getByText('opportunity-score',{exact:true})).toBeVisible();
 parity=await open(page,'waarde-financiering');
 await expect(parity).toBeVisible();
 await expect(parity.getByText('dcf',{exact:true})).toBeVisible();
 await expect(parity.getByText('altman-z',{exact:true})).toBeVisible();
 await expect(parity.getByText('dscr',{exact:true})).toBeVisible();
});

test('strategy, compliance, due diligence, advice and roadmap calculations are native V2',async({page})=>{
 const preview=process.env.PREVIEW_URL;if(!preview)throw new Error('PREVIEW_URL is required');
 await boot(page,preview);
 for(const [pageId,calculation] of [['compliance-governance','compliance-risk'],['strategie-naar-maandagochtend','priority-filter'],['due-diligence','red-flags'],['advies','cross-model-weight'],['roadmap','roadmap-value']]){
  const parity=await open(page,pageId);
  await expect(parity).toBeVisible();
  await expect(parity.getByText(calculation,{exact:true})).toBeVisible();
 }
});
