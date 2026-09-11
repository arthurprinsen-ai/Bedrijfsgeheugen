import { test, expect } from '@playwright/test';

const BASE_VIEWPORT={width:1440,height:1100};

async function hideNetlifyChrome(page){
  await page.addInitScript(()=>{
    try{localStorage.setItem('nf_preview_outpost_closed','true');}catch{}
  });
}

async function openPortalV2(page, preview){
  await page.goto(`${preview}/portal-v2/?bg_live=${Date.now()}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.app');
  await page.waitForFunction(()=>document.querySelectorAll('.mobilebar button').length===5);
}

test('portal v2 renders the approved standalone shell on desktop', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  await page.setViewportSize(BASE_VIEWPORT);
  await openPortalV2(page, preview);
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.main')).toBeVisible();
  await expect(page.locator('.brainflow')).toBeVisible();
  await expect(page.getByText('AI Management Summary')).toBeVisible();
  await expect(page.locator('.mobilebar')).toBeHidden();
});

test('portal v2 standalone shell has no horizontal overflow on desktop', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  await page.setViewportSize(BASE_VIEWPORT);
  await openPortalV2(page, preview);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('portal v2 approved phone widths stay usable without horizontal page overflow', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.setViewportSize({width:320,height:720});
  await openPortalV2(page, preview);

  for(const [width,height] of [[320,720],[390,844],[430,932]]){
    await page.setViewportSize({width,height});
    await expect(page.locator('.mobilebar')).toBeVisible();
    const rootOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(rootOverflow).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test('mobile primary navigation routes all five controls on supported phone widths', async ({ page }) => {
  const preview = process.env.PREVIEW_URL;
  if (!preview) throw new Error('PREVIEW_URL is required');
  await hideNetlifyChrome(page);
  await page.setViewportSize({ width:320, height:720 });
  await openPortalV2(page, preview);

  for (const [width,height] of [[320,720],[390,844],[430,932]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(()=>{history.replaceState(null,'',location.pathname+location.search.split('&bg_live=')[0]);document.querySelector('[data-mobile-nav="overview"]')?.click();});
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
      ['project', 'hub', 'project'],
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
