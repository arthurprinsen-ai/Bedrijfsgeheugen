import { test, expect } from '@playwright/test';
import { LEGACY_PARITY_ITEMS, GLOBAL_PARITY_CAPABILITIES } from '../../portal-v2/parity-manifest.js';
import { getCapabilityContract } from '../../portal-v2/capability-contracts.js';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';
const uniquePages=[...new Set(LEGACY_PARITY_ITEMS.flatMap(item=>item.v2Pages))];
const PHONE_VIEWPORTS=[[320,720],[390,844],[430,932]];

const CAPABILITY_PROBES=Object.freeze({
 overzicht:{pageId:'overzicht',path:'portal.profile.maturity.sturing',value:5},
 profiel:{pageId:'profiel',path:'portal.profile.employees',value:31},
 dataai:{pageId:'data-ai',path:'portal.dataAi.maturity',value:4},
 aiscan:{pageId:'ai-scan',path:'portal.aiScan.hourlyRate',value:91},
 invoeren:{pageId:'gegevens-invullen',path:'portal.metrics.revenue',value:4321},
 antwoorden:{pageId:'ingevulde-gegevens',path:'portal.profile.hourlyCost',value:73},
 business:{pageId:'businesscase',path:'portal.businessCase.target',value:5},
 cijfers:{pageId:'cijfers-maatstaven',path:'portal.metrics.nps',value:37},
 waarde:{pageId:'waarde-financiering',path:'portal.valueFinance.multiple',value:6.2},
 mensen:{pageId:'mensen',path:'portal.people.absence',value:3.4},
 branche:{pageId:'branche-markt',path:'portal.market.industry',value:'productie-parity-probe'},
 onderzoek:{pageId:'onderzoek',path:'portal.research.filter',value:'productie-parity-probe'},
 beleid:{pageId:'compliance-governance',path:'portal.compliance.policies.0',value:'vastgesteld'},
 aicap:{pageId:'ai-capabilities',path:'portal.aiCapabilities.0',value:4},
 strategie:{pageId:'strategie-naar-maandagochtend',path:'portal.strategy.horizon',value:'6 maanden'},
 canvassen:{pageId:'canvassen',path:'portal.canvases.bmc.answer',value:'productie-parity-probe'},
 eindconclusie:{pageId:'eindconclusie',path:'portal.finalConclusion.text',value:'productie-parity-probe'},
 dd:{pageId:'due-diligence',path:'portal.dueDiligence.findings',value:[{area:'Parity',finding:'productie-parity-probe',evidence:'runtime',materiality:1,redFlag:false,owner:'test'}]},
 dna:{pageId:'strategy-dna',path:'portal.strategy.dna.ambitie',value:'productie-parity-probe'},
 bijhouden:{pageId:'actueel-houden',path:'portal.freshness.what',value:'productie-parity-probe'},
 wijzigingen:{pageId:'wijzigingen',path:'portal.changes.toTasks.theme',value:'productie-parity-probe'},
 advies:{pageId:'advies',path:'portal.advice.modelFilter',value:'productie-parity-probe'},
 offerte:{pageId:'offerte',path:'portal.offer.scope',value:'productie-parity-probe'},
 roadmap:{pageId:'roadmap',path:'portal.roadmap.draft.title',value:'productie-parity-probe'}
});

async function hideNetlifyChrome(page){
 await page.route('**/cdp/**',route=>route.abort());
 await page.addInitScript(()=>{const style=document.createElement('style');style.textContent='iframe[title="Netlify Drawer"],[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}';const attach=()=>document.documentElement?.appendChild(style);if(document.documentElement)attach();else document.addEventListener('DOMContentLoaded',attach,{once:true});});
}

async function bootDemo(page,width=1440,height=1000){
 await page.setViewportSize({width,height});
 const response=await page.goto(`${BASE_URL}/klantportaal?klant=demoAI&bg_full_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
 expect(response,'demoAI response').not.toBeNull();
 expect(response.status(),'demoAI status').toBeLessThan(400);
 await page.waitForFunction(()=>Boolean(document.querySelector('.app'))&&Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.()),{timeout:30_000});
}

async function openNative(page,pageId){
 await page.evaluate(async id=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage(id);},pageId);
 if(pageId==='overzicht')return;
 const view=page.locator('#portalView');
 await expect(view,`${pageId} must open in native V2 view`).toHaveAttribute('data-page-id',pageId,{timeout:10_000});
 await expect(view).toHaveAttribute('aria-hidden','false');
 await expect(view.locator('h1,h2,h3').first(),`${pageId} needs visible native content`).toBeVisible();
}

async function readPaths(page,entries){
 return page.evaluate(items=>Object.fromEntries(items.map(([id,path])=>[id,globalThis.__BG_PORTAL_DOMAIN_STATE__?.get?.(path)])),entries);
}

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

test('all 24 protected capabilities honor the declared 320, 390 and 430 mobile browser contract',async({page})=>{
 test.setTimeout(240_000);
 await hideNetlifyChrome(page);
 for(const [width,height] of PHONE_VIEWPORTS){
  await bootDemo(page,width,height);
  for(const item of LEGACY_PARITY_ITEMS){
   const contract=getCapabilityContract(item.v2Pages[0]);
   expect(contract?.browserContract?.mobileWidths,`${item.legacyId} mobile contract`).toEqual([320,390,430]);
   const pageId=item.v2Pages[0];
   if(pageId!=='overzicht')await openNative(page,pageId);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(overflow,`${item.legacyId}@${width} must not overflow`).toBeLessThanOrEqual(1);
   const root=pageId==='overzicht'?page.locator('.app'):page.locator('#portalView');
   await expect(root,`${item.legacyId}@${width} must remain visible`).toBeVisible();
  }
 }
});

test('all 24 protected capability state paths survive server-confirmed save and reopen, then restore exactly',async({page})=>{
 test.setTimeout(240_000);
 await hideNetlifyChrome(page);
 await bootDemo(page);
 const probeEntries=LEGACY_PARITY_ITEMS.map(item=>{
  const probe=CAPABILITY_PROBES[item.legacyId];
  expect(probe,`${item.legacyId} must own an aggregate persistence probe`).toBeTruthy();
  const contract=getCapabilityContract(probe.pageId);
  expect(contract?.browserContract?.editAndReopen,`${item.legacyId} edit/reopen contract`).toBe(true);
  expect(contract?.browserContract?.requiresPersistenceProof,`${item.legacyId} persistence contract`).toBe(true);
  return [item.legacyId,probe.path,probe.value,probe.pageId];
 });
 const originalState=await page.evaluate(()=>structuredClone(globalThis.__BG_PORTAL_DOMAIN_STATE__.get()));
 try{
  await page.evaluate(async entries=>{
   const state=globalThis.__BG_PORTAL_DOMAIN_STATE__;
   for(const [,path,value] of entries)state.set(path,value);
   await state.flush();
   if(state.status()!=='saved')throw new Error(`PERSISTENCE_NOT_SERVER_CONFIRMED:${state.status()}`);
  },probeEntries);

  await bootDemo(page);
  const persisted=await readPaths(page,probeEntries.map(([id,path])=>[id,path]));
  for(const [id,,value,pageId] of probeEntries){
   expect(persisted[id],`${id} must reopen from server-confirmed state`).toEqual(value);
   await openNative(page,pageId);
  }
 } finally {
  await page.evaluate(async original=>{
   const state=globalThis.__BG_PORTAL_DOMAIN_STATE__;
   state.set('',original);
   await state.flush();
   if(state.status()!=='saved')throw new Error(`RESTORE_NOT_SERVER_CONFIRMED:${state.status()}`);
  },originalState);
  await bootDemo(page);
  const restored=await page.evaluate(()=>globalThis.__BG_PORTAL_DOMAIN_STATE__.get());
  expect(restored,'demoAI state must be restored after aggregate production proof').toEqual(originalState);
 }
});

test('all global capabilities are native, mobile-safe and fail closed without auth',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const response=await page.goto(`${BASE_URL}/portal-v2/?bg_global_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
 expect(response?.status()).toBeLessThan(400);
 const mobile=page.locator('[data-mobile-nav]');await expect(mobile).toHaveCount(5);
 for(let i=0;i<5;i++){const box=await mobile.nth(i).boundingBox();expect(box?.height||0,`mobile nav ${i}`).toBeGreaterThanOrEqual(44)}
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
