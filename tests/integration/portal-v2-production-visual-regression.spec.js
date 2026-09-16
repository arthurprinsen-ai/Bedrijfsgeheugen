import { test, expect } from '@playwright/test';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const BASE_URL=process.env.PRODUCTION_URL||process.env.PREVIEW_URL||'https://www.bedrijfsgeheugen.nl';
const VISUAL_BASELINE=process.env.VISUAL_BASELINE||'';
const VISUAL_CAPTURE_PATH=process.env.VISUAL_CAPTURE_PATH||'';
const VISUAL_ACTUAL_PATH=process.env.VISUAL_ACTUAL_PATH||'';

async function bootCanvassen(page){
  await page.setViewportSize({width:1280,height:1000});
  const response=await page.goto(`${BASE_URL}/portaal/demo?bg_visual_regression=stable`,{waitUntil:'domcontentloaded',timeout:45_000});
  expect(response,'visual target response').not.toBeNull();
  expect(response.status(),'visual target status').toBeLessThan(400);
  await page.waitForFunction(()=>Boolean(document.querySelector('.app'))&&Boolean(globalThis.__BG_PORTAL_DOMAIN_STATE__?.initialized?.()),{timeout:30_000});
  await page.evaluate(async()=>{const module=await import('/portal-v2/page-shell.js');module.openPortalPage('canvassen');});
  const workspace=page.locator('[data-functional-workspace="canvassen"]');
  await expect(workspace).toBeVisible({timeout:10_000});
  // mountWorkspace exposes the shell synchronously, then imports/mounts the
  // specialist Canvassen renderer asynchronously. Screenshot only after that
  // renderer is complete, otherwise baseline and candidate can capture two
  // different lifecycle phases of the same UI.
  await expect(workspace.locator('.canvas-summary')).toBeVisible({timeout:10_000});
  await expect(workspace.locator('[data-canvas]')).toHaveCount(6,{timeout:10_000});
  await page.evaluate(()=>document.fonts?.ready);
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}input,textarea{caret-color:transparent!important}'});
  return workspace;
}

test('Canvassen visual regression is deterministic and fail-closed against an approved baseline',async({page},testInfo)=>{
  test.skip(!VISUAL_BASELINE&&!VISUAL_CAPTURE_PATH,'Dedicated visual readback supplies capture or approved baseline mode.');
  const workspace=await bootCanvassen(page);

  if(VISUAL_CAPTURE_PATH){
    await mkdir(dirname(VISUAL_CAPTURE_PATH),{recursive:true});
    await workspace.screenshot({path:VISUAL_CAPTURE_PATH,animations:'disabled',caret:'hide'});
    return;
  }

  const snapshotPath=testInfo.snapshotPath('portal-v2-canvassen.png');
  await mkdir(dirname(snapshotPath),{recursive:true});
  await copyFile(VISUAL_BASELINE,snapshotPath);
  const actual=await workspace.screenshot({animations:'disabled',caret:'hide'});
  if(VISUAL_ACTUAL_PATH){
    await mkdir(dirname(VISUAL_ACTUAL_PATH),{recursive:true});
    await writeFile(VISUAL_ACTUAL_PATH,actual);
  }
  expect(actual).toMatchSnapshot('portal-v2-canvassen.png',{maxDiffPixelRatio:0.001,threshold:0.2});
});
