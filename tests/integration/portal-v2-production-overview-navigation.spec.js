import { test, expect } from '@playwright/test';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';

async function bootDemo(page){
  const response=await page.goto(`${BASE_URL}/klantportaal?klant=demoAI&bg_overview_parity=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45_000});
  expect(response,'demoAI response').not.toBeNull();
  expect(response.status(),'demoAI status').toBeLessThan(400);
  await page.waitForFunction(()=>Boolean(document.querySelector('.app'))&&Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.()),{timeout:30_000});
}

test('V2 overview exposes legacy company-state and adoption surfaces',async({page})=>{
  await bootDemo(page);
  const insights=page.locator('[data-legacy-overview-insights]');
  await expect(insights).toBeVisible({timeout:10_000});
  await expect(insights).toContainText('Stand van je bedrijf');
  await expect(insights).toContainText('Adoptiecurve');
  await expect(insights).toContainText('CMMI');
  await expect(insights).toContainText('Waar organisatie staat');
  await expect(insights.locator('.adoption-step')).toHaveCount(5);
  await expect(insights.locator('.adoption-step')).toHaveCount(5);
  const profileKnown=await insights.locator('.adoption-step.current').count();
  expect([0,1]).toContain(profileKnown);
});

test('canonical sidebar remains available and preserves parent context on opened V2 pages',async({page})=>{
  await bootDemo(page);
  await page.evaluate(async()=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage('profiel');});
  const portal=page.locator('#portalView');
  await expect(portal).toHaveAttribute('data-page-id','profiel');

  const nav=page.locator('.sidebar .nav');
  await expect(nav).toBeVisible();
  for(const label of ['Overzicht','CSRD & Impact','Bedrijfsgezondheid','Strategie & uitvoering','Processen & organisatie','Kennis','Data & koppelingen','AI & Insights','Acties & impact','Rapportages & beheer']){
    await expect(nav.getByRole('button',{name:label,exact:true})).toHaveCount(1);
  }
  await expect(nav.getByRole('button',{name:'Bedrijfsgezondheid',exact:true})).toHaveClass(/active/);
  await expect(portal.locator('#pvKicker')).toHaveText('Bedrijfsgezondheid');

  await page.evaluate(async()=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage('roadmap');});
  await expect(portal).toHaveAttribute('data-page-id','roadmap');
  await expect(nav.getByRole('button',{name:'Strategie & uitvoering',exact:true})).toHaveClass(/active/);
  await expect(portal.locator('#pvKicker')).toHaveText('Strategie & uitvoering');
});
