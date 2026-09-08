const { test, expect } = require('@playwright/test');

async function hideNetlifyChrome(page) {
  await page.route('**/cdp/**', route => route.abort());
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'iframe[title="Netlify Drawer"],[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}';
    const attach = () => document.documentElement && document.documentElement.appendChild(style);
    if (document.documentElement) attach(); else document.addEventListener('DOMContentLoaded', attach, { once:true });
  });
}

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || String(error)));
  return errors;
}

async function openPortalV2(page, preview) {
  await page.goto(`${preview}/portal-v2/?klant=ijsselmonde`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Welkom terug, Arthur', exact: true })).toBeVisible({ timeout: 30_000 });
}

test('portal-v2 serves the approved SaaS desktop dashboard composition', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = collectPageErrors(page);
  await openPortalV2(page, preview);

  await expect(page.getByText('Grip op je bedrijf. Ruimte om te groeien.', { exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.kpi')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: /Het brein van je bedrijf/ })).toBeVisible();
  await expect(page.locator('.brainflow .brainnode')).toHaveCount(5);
  await expect(page.locator('.brainnode[data-stage="sources"]')).toBeVisible();
  await expect(page.locator('.brainnode[data-stage="datahub"]')).toBeVisible();
  await expect(page.locator('.brainnode[data-stage="brain"]')).toBeVisible();
  await expect(page.locator('.brainnode[data-stage="powerhouse"]')).toBeVisible();
  await expect(page.locator('.brainnode[data-stage="outcomes"]')).toBeVisible();
  await expect(page.locator('.braincapchip')).toHaveCount(6);
  await expect(page.locator('.sources')).toBeVisible();
  await expect(page.locator('.modules')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'AI Management Summary', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Roadmap & voortgang', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kansen & bedreigingen', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Impact overzicht', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recente activiteiten', exact: true })).toBeVisible();

  const flowGeometry = await page.locator('.brainflow .brainnode').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height };
  }));
  expect(flowGeometry.every((item, index) => index === 0 || item.x > flowGeometry[index - 1].x)).toBeTruthy();

  await page.screenshot({ path: 'artifacts/portal-v2-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('portal-v2 uses a vertical SaaS brain and card-first CSRD on a phone without page overflow', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = collectPageErrors(page);
  await openPortalV2(page, preview);

  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.mobilebar')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Het brein van je bedrijf/ })).toBeVisible();
  await expect(page.locator('.brainflow .brainnode')).toHaveCount(5);

  const mobileFlow = await page.locator('.brainflow .brainnode').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height };
  }));
  expect(mobileFlow.every((item, index) => index === 0 || item.y > mobileFlow[index - 1].y)).toBeTruthy();
  expect(Math.max(...mobileFlow.map(item => item.x)) - Math.min(...mobileFlow.map(item => item.x))).toBeLessThanOrEqual(2);

  await page.evaluate(() => {
    const button = [...document.querySelectorAll('.nav button')].find(node => node.textContent.includes('CSRD'));
    button?.click();
  });
  await expect(page.locator('#portalView')).toHaveClass(/open/);
  await expect(page.locator('.csrd-mobile-summary')).toBeVisible();
  await expect(page.locator('.csrd-world')).toBeHidden();
  await expect(page.locator('.csrd-mobile-domain')).toHaveCount(5);
  await expect(page.locator('.csrd-mobile-domains')).toBeVisible();
  const firstDomainButton = page.locator('.csrd-mobile-domain button').first();
  await expect(firstDomainButton).toBeVisible();
  expect(await firstDomainButton.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  await page.screenshot({ path: 'artifacts/portal-v2-mobile.png', fullPage: true });

  const rootOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(rootOverflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('mobile primary navigation routes all five controls on supported phone widths', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);

  for (const [width,height] of [[320,720],[390,844],[430,932]]) {
    await page.setViewportSize({ width, height });
    await openPortalV2(page, preview);
    const bar=page.locator('.mobilebar');
    await expect(bar).toBeVisible();
    const buttons=bar.locator('button');
    await expect(buttons).toHaveCount(5);
    for(let index=0;index<5;index++){
      const box=await buttons.nth(index).boundingBox();
      expect(box, `${width}px button ${index} must have geometry`).toBeTruthy();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    const expected=[
      ['overview', null, null],
      ['portal', 'hub', 'portal'],
      ['data-ai', 'hub', 'data-ai'],
      ['tasks', 'hub', 'tasks'],
      ['more', 'hub', 'more']
    ];
    for(const [id,param,value] of expected){
      await page.evaluate(({id})=>document.querySelector(`[data-mobile-nav="${id}"]`)?.click(),{id});
      await expect(page.locator(`[data-mobile-nav="${id}"]`)).toHaveAttribute('aria-current','page');
      const url=new URL(page.url());
      if(param) expect(url.searchParams.get(param)).toBe(value); else {
        expect(url.searchParams.get('hub')).toBeNull();
        expect(url.searchParams.get('page')).toBeNull();
      }
    }

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
