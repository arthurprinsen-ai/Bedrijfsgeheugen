import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const contractPath=process.env.VISUAL_ASSURANCE_CONTRACT||'config/powerhouse-portal-visual-assurance-v1.json';
const contract=JSON.parse(await fs.readFile(contractPath,'utf8'));
const base=(process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const out=process.env.OUT_DIR||'.artifacts/portal-visual-density';
const pages=contract.routes.map(item=>[item.id,item.path]);
const viewports=contract.viewports.map(item=>[item.id,{width:item.width,height:item.height}]);
const limits=contract.thresholds;

await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
const report=[];
for(const [pageName,route] of pages){
  for(const [vpName,viewport] of viewports){
    const page=await browser.newPage({viewport});
    await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(1200);
    const file=path.join(out,`${pageName}-${vpName}.png`);
    await page.screenshot({path:file,fullPage:true});
    const metrics=await page.evaluate(()=>{
      const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1};
      const box=el=>{const r=el.getBoundingClientRect();return {selector:el.className||el.tagName,width:Math.round(r.width),height:Math.round(r.height),top:Math.round(r.top)}};
      const selectors=['.csrd-world','.csrd-meter-ring','.core','.brainimg','.workspace-card','img','svg','canvas'];
      const items=selectors.flatMap(sel=>[...document.querySelectorAll(sel)].filter(visible).map(box));
      const overflow=document.documentElement.scrollWidth-window.innerWidth;
      const rect=selector=>{const el=document.querySelector(selector);return el&&visible(el)?box(el):null};
      return {
        viewport:{width:innerWidth,height:innerHeight},
        overflow,
        csrd:rect('.csrd-world'),
        meter:rect('.csrd-meter-ring'),
        core:rect('.core'),
        brain:rect('.brainimg'),
        largest:items.sort((a,b)=>b.height-a.height).slice(0,12)
      };
    });
    const errs=[];
    if(metrics.overflow>limits.horizontal_overflow_px) errs.push(`horizontal overflow ${metrics.overflow}px > ${limits.horizontal_overflow_px}px`);
    if(metrics.csrd && vpName!=='mobile' && metrics.csrd.height>limits.csrd_world_max_height_px) errs.push(`CSRD visual ${metrics.csrd.height}px > ${limits.csrd_world_max_height_px}px`);
    if(metrics.csrd && vpName==='mobile' && limits.mobile_csrd_world_must_be_hidden) errs.push('CSRD decorative world must be hidden on mobile');
    if(metrics.meter && vpName!=='mobile' && metrics.meter.width>limits.desktop_tablet_score_meter_max_px) errs.push(`score meter ${metrics.meter.width}px > ${limits.desktop_tablet_score_meter_max_px}px`);
    if(metrics.meter && vpName==='mobile' && metrics.meter.width>limits.mobile_score_meter_max_px) errs.push(`mobile score meter ${metrics.meter.width}px > ${limits.mobile_score_meter_max_px}px`);
    if(metrics.core && metrics.core.height>limits.brain_core_max_height_px) errs.push(`brain core ${metrics.core.height}px too tall`);
    const brainLimit=vpName==='mobile'?limits.brain_image_mobile_max_height_px:limits.brain_image_desktop_tablet_max_height_px;
    if(metrics.brain && metrics.brain.height>brainLimit) errs.push(`brain image ${metrics.brain.height}px > ${brainLimit}px`);
    report.push({fingerprint:contract.fingerprint,loop_key:contract.loop_key,page:pageName,viewport:vpName,file,metrics,errors:errs});
    for(const err of errs) failures.push(`${pageName}/${vpName}: ${err}`);
    await page.close();
  }
}
await browser.close();
const summary={
  version:contract.version,
  fingerprint:contract.fingerprint,
  loop_key:contract.loop_key,
  observed_at:new Date().toISOString(),
  base_url:base,
  status:failures.length?'FAIL':'PASS',
  expected_screenshots:pages.length*viewports.length,
  failures,
  report
};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
await fs.writeFile(path.join(out,'assurance.json'),JSON.stringify(summary,null,2));
if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Portal visual density OK; ${summary.expected_screenshots} screenshots: ${out}`);
