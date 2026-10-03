import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const out=process.env.OUT_DIR||'.artifacts/portal-visual-density';
const pages=[
  ['overview','/portal-v2/?page=overview'],
  ['csrd-impact','/portal-v2/?page=csrd-impact'],
  ['data-ai','/portal-v2/?page=data-ai']
];
const viewports=[
  ['desktop',{width:1440,height:900}],
  ['tablet',{width:1024,height:768}],
  ['mobile',{width:390,height:844}]
];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
const report=[];
for(const [pageName,route] of pages){
  for(const [vpName,viewport] of viewports){
    const page=await browser.newPage({viewport});
    await page.goto(base+route,{waitUntil:'networkidle',timeout:45000});
    await page.waitForTimeout(600);
    const file=path.join(out,`${pageName}-${vpName}.png`);
    await page.screenshot({path:file,fullPage:true});
    const metrics=await page.evaluate(({vpName})=>{
      const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1};
      const box=el=>{const r=el.getBoundingClientRect();return {selector:el.className||el.tagName,width:Math.round(r.width),height:Math.round(r.height),top:Math.round(r.top)}};
      const selectors=['.csrd-world','.csrd-meter-ring','.core','.brainimg','.workspace-card','img','svg','canvas'];
      const items=selectors.flatMap(sel=>[...document.querySelectorAll(sel)].filter(visible).map(box));
      const overflow=document.documentElement.scrollWidth-window.innerWidth;
      const csrd=document.querySelector('.csrd-world');
      const meter=document.querySelector('.csrd-meter-ring');
      const core=document.querySelector('.core');
      const brain=document.querySelector('.brainimg');
      const rect=el=>el&&visible(el)?box(el):null;
      return {viewport:{width:innerWidth,height:innerHeight},overflow,csrd:rect(csrd),meter:rect(meter),core:rect(core),brain:rect(brain),largest:items.sort((a,b)=>b.height-a.height).slice(0,12)};
    },{vpName});
    const errs=[];
    if(metrics.overflow>2) errs.push(`horizontal overflow ${metrics.overflow}px`);
    if(metrics.csrd && vpName!=='mobile' && metrics.csrd.height>340) errs.push(`CSRD visual ${metrics.csrd.height}px > 340px`);
    if(metrics.csrd && vpName==='mobile' && metrics.csrd.height>0) errs.push('CSRD decorative world must be hidden on mobile');
    if(metrics.meter && vpName!=='mobile' && metrics.meter.width>112) errs.push(`score meter ${metrics.meter.width}px > 112px`);
    if(metrics.meter && vpName==='mobile' && metrics.meter.width>92) errs.push(`mobile score meter ${metrics.meter.width}px > 92px`);
    if(metrics.core && metrics.core.height>(vpName==='mobile'?260:260)) errs.push(`brain core ${metrics.core.height}px too tall`);
    if(metrics.brain && metrics.brain.height>(vpName==='mobile'?100:96)) errs.push(`brain image ${metrics.brain.height}px too tall`);
    report.push({page:pageName,viewport:vpName,file,metrics,errors:errs});
    for(const err of errs) failures.push(`${pageName}/${vpName}: ${err}`);
    await page.close();
  }
}
await browser.close();
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Portal visual density OK; screenshots: ${out}`);
