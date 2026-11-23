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
  // The original company/adoption model remains intact, but is no longer
  // forced in front of the entrepreneur's one primary decision.
  const more=page.locator('details[data-portal-overview-depth="v1"]');
  await expect(more).toHaveCount(1);
  await expect(more).not.toHaveAttribute('open','');
  const overviewSummary=more.locator(':scope > summary');
  await expect(overviewSummary, 'only the direct accessible company-details summary may be activated').toHaveCount(1);
  await overviewSummary.click();
  await expect(more).toHaveAttribute('open','');
  const insights=more.locator('[data-legacy-overview-insights]');
  await expect(insights).toBeVisible({timeout:10_000});
  await expect(insights).toContainText('Stand van je bedrijf');
  await expect(insights).toContainText('Adoptiecurve');
  await expect(insights).toContainText('CMMI');
  await expect(insights).toContainText('Waar organisatie staat');
  await expect(insights.locator('.adoption-step')).toHaveCount(5);
});

test('canonical sidebar contains all pages and preserves exact active page context',async({page})=>{
  await bootDemo(page);
  const nav=page.locator('.sidebar .nav.portal-single-navigation');
  await expect(nav).toBeVisible();
  await expect(nav.locator('[data-nav-target="profiel"]')).toHaveCount(1);
  await expect(nav.locator('[data-nav-target="roadmap"]')).toHaveCount(1);
  await expect(nav.locator('[data-nav-target="powerhouse-control-center"]')).toHaveCount(1);

  await page.evaluate(async()=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage('profiel');});
  const portal=page.locator('#portalView');
  await expect(portal).toHaveAttribute('data-page-id','profiel');
  await expect(nav.locator('[data-nav-target="profiel"]')).toHaveClass(/active/);
  await expect(portal.locator('#pvKicker')).toHaveText('Besturen');

  await page.evaluate(async()=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage('roadmap');});
  await expect(portal).toHaveAttribute('data-page-id','roadmap');
  await expect(nav.locator('[data-nav-target="roadmap"]')).toHaveClass(/active/);
  await expect(portal.locator('#pvKicker')).toHaveText('Besturen');
});
