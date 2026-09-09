const { test, expect } = require('@playwright/test');

test.describe.configure({timeout:120000});

async function boot(page,preview){
 await page.route('**/cdp/**',route=>route.abort());
 let lastError;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const response=await page.goto(`${preview}/portal-v2/?bg_algorithm_parity=${Date.now()}-${attempt}`,{waitUntil:'domcontentloaded',timeout:45000});
   expect(response,'portal preview response').not.toBeNull();
   expect(response.status(),'portal preview status').toBeLessThan(400);
   await page.getByRole('heading',{name:'Welkom terug, Arthur',exact:true}).waitFor({state:'visible',timeout:15000});
   await page.waitForFunction(()=>Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__),{timeout:30000});
   return;
  }catch(error){lastError=error;}
 }
 throw lastError;
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
