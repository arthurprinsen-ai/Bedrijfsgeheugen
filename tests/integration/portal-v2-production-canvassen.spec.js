import { test, expect } from '@playwright/test';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';
const EXPECTED_CANVASES=[
  ['bmc','Business Model Canvas'],
  ['vpc2','Waardepropositiecanvas'],
  ['lean','Lean Canvas'],
  ['merk','Merkcanvas'],
  ['content','Contentcanvas'],
  ['sales2','Salescanvas']
];

async function bootDemo(page){
  const response=await page.goto(`${BASE_URL}/klantportaal?klant=demoAI&bg_canvas_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
  expect(response,'demoAI response').not.toBeNull();
  expect(response.status(),'demoAI status').toBeLessThan(400);
  await page.waitForFunction(()=>Boolean(document.querySelector('.app'))&&Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.()),{timeout:30_000});
  await page.evaluate(async()=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage('canvassen');});
  await expect(page.locator('#portalView')).toHaveAttribute('data-page-id','canvassen',{timeout:10_000});
  await expect(page.locator('[data-functional-workspace="canvassen"]')).toBeVisible({timeout:10_000});
}

test('Canvassen production renders the six full legacy canvases from Powerhouse state',async({page})=>{
  await bootDemo(page);
  const workspace=page.locator('[data-functional-workspace="canvassen"]');
  await expect(workspace.locator('.canvas-summary h3')).toHaveText('Canvasconclusie');
  await expect(workspace.locator('.canvas-summary small')).toContainText('canonieke klantinvoer + afzonderlijk gelabelde Powerhouse-signalen');
  await expect(workspace.locator('.canvas-card')).toHaveCount(6);

  for(const [id,title] of EXPECTED_CANVASES){
    const card=workspace.locator(`.canvas-card[data-canvas="${id}"]`);
    await expect(card,`${id} must exist`).toHaveCount(1);
    await expect(card.locator('header small')).toHaveText(title);
    expect(await card.locator('.canvas-sections section').count(),`${id} must contain full structured canvas content`).toBeGreaterThanOrEqual(6);
    await expect(card.locator(`[data-canvas-answer="${id}"]`)).toBeEditable();
    await expect(card.locator(`[data-canvas-owner="${id}"]`)).toBeEditable();
  }

  const stateContract=await page.evaluate(()=>({
    initialized:globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.(),
    status:globalThis.__BG_PORTAL_DOMAIN_STATE__?.status?.(),
    hasPortal:Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.get?.('portal')),
    hasSet:typeof globalThis.__BG_PORTAL_DOMAIN_STATE__?.set==='function',
    hasFlush:typeof globalThis.__BG_PORTAL_DOMAIN_STATE__?.flush==='function'
  }));
  expect(stateContract).toEqual({initialized:true,status:'idle',hasPortal:true,hasSet:true,hasFlush:true});
});

test('Canvassen production binds edits to canonical domain state and confirms a safe demo writeback round-trip',async({page})=>{
  await bootDemo(page);
  const workspace=page.locator('[data-functional-workspace="canvassen"]');
  const answer=workspace.locator('[data-canvas-answer="bmc"]');
  const original=await answer.inputValue();
  const probe=`${original} parity-probe-${Date.now()}`.trim();

  await answer.fill(probe);
  await expect.poll(()=>page.evaluate(()=>globalThis.__BG_PORTAL_DOMAIN_STATE__.get('portal.canvases.bmc.answer'))).toBe(probe);
  await expect.poll(()=>page.evaluate(()=>globalThis.__BG_PORTAL_DOMAIN_STATE__.status())).toBe('dirty');

  await answer.fill(original);
  await workspace.locator('[data-canvas-save]').click();
  await expect(workspace.locator('[data-canvas-status]')).toHaveText('Opgeslagen en server-bevestigd.');
  await expect.poll(()=>page.evaluate(()=>globalThis.__BG_PORTAL_DOMAIN_STATE__.status())).toBe('saved');
  expect(await page.evaluate(()=>globalThis.__BG_PORTAL_DOMAIN_STATE__.get('portal.canvases.bmc.answer'))).toBe(original);

  await workspace.locator('[data-workspace-tab="bewijs"]').click();
  await expect(workspace).toContainText('portal.canvases + canonieke klantstate');
  await expect(workspace).toContainText('Zes ingevulde canvassen + canvasconclusie');
  await expect(workspace).toContainText('6/6');
});
