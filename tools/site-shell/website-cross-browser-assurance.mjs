import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const contractPath=process.env.WEBSITE_ASSURANCE_CONTRACT||'config/powerhouse-website-cross-browser-assurance-v1.json';
const contract=JSON.parse(await fs.readFile(contractPath,'utf8'));
const base=(process.env.BASE_URL||contract.base_url).replace(/\/$/,'');
const out=process.env.OUT_DIR||'.artifacts/website-cross-browser-assurance';
const routeLimit=Math.max(0,Number(process.env.ROUTE_LIMIT||0));
const engines={chromium,firefox,webkit};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const slug=value=>value==='/'?'home':value.replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9-]+/gi,'-').replace(/-+/g,'-').slice(0,100)||'home';

await fs.mkdir(out,{recursive:true});

async function readRoutes(){
  const res=await fetch(base+'/sitemap.xml',{signal:AbortSignal.timeout(15000)});
  if(!res.ok) throw new Error(`sitemap HTTP ${res.status}`);
  const xml=await res.text();
  let routes=[...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map(match=>new URL(match[1].replace(/&amp;/g,'&')).pathname.replace(/\/+$/,'')||'/')
    .filter(route=>!/\.(?:png|jpe?g|webp|gif|svg|css|m?js|xml|txt|pdf|mp4|webm|ico)$/i.test(route));
  routes=[...new Set(routes)];
  return routeLimit>0?routes.slice(0,routeLimit):routes;
}

async function inspect(page){
  return page.evaluate(()=>{
    const visible=el=>{
      if(!el)return false;
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return s.display!=='none'&&s.visibility!=='hidden'&&Number.parseFloat(s.opacity||'1')>0&&r.width>1&&r.height>1;
    };
    const inspectBox=el=>{if(!el)return null;const r=el.getBoundingClientRect();return{visible:visible(el),x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}};
    const main=document.querySelector('main');
    const h1=document.querySelector('main h1,h1');
    const header=document.querySelector('header,nav.bgkop,.v17-header');
    const brokenImages=[...document.images].filter(img=>img.complete&&img.naturalWidth===0).map(img=>img.currentSrc||img.src);
    const overflow=Math.max(0,document.documentElement.scrollWidth-innerWidth);
    return {
      title:document.title,
      canonical:document.querySelector('link[rel="canonical"]')?.href||null,
      main:inspectBox(main),
      h1:inspectBox(h1),
      header:inspectBox(header),
      h1Text:(h1?.innerText||'').trim().slice(0,200),
      mainTextLength:(main?.innerText||'').trim().length,
      overflow,
      brokenImages:brokenImages.slice(0,20),
      linkCount:document.querySelectorAll('a[href]').length,
      buttonCount:document.querySelectorAll('button').length,
      lang:document.documentElement.lang||null,
      cls:Number(window.__bgWebsiteCls||0),
      clsEntries:(window.__bgWebsiteClsEntries||[]).slice(0,20)
    };
  });
}

async function installCls(page){
  await page.addInitScript(()=>{
    window.__bgWebsiteCls=0;
    window.__bgWebsiteClsEntries=[];
    const selectorFor=node=>{
      if(!node||node.nodeType!==1)return null;
      if(node.id)return '#'+CSS.escape(node.id);
      const cls=[...node.classList||[]].slice(0,3).map(c=>'.'+CSS.escape(c)).join('');
      return node.tagName.toLowerCase()+cls;
    };
    try{
      new PerformanceObserver(list=>{
        for(const entry of list.getEntries()){
          if(entry.hadRecentInput)continue;
          window.__bgWebsiteCls+=entry.value;
          window.__bgWebsiteClsEntries.push({
            value:entry.value,
            startTime:entry.startTime,
            sources:[...(entry.sources||[])].map(source=>({
              selector:selectorFor(source.node),
              previousRect:source.previousRect?{x:source.previousRect.x,y:source.previousRect.y,width:source.previousRect.width,height:source.previousRect.height}:null,
              currentRect:source.currentRect?{x:source.currentRect.x,y:source.currentRect.y,width:source.currentRect.width,height:source.currentRect.height}:null
            }))
          });
        }
      }).observe({type:'layout-shift',buffered:true});
    }catch{}
  });
}

async function gotoSettled(page,url){
  let last;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
      await page.evaluate(async()=>{if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1200))]);});
      await sleep(250);
      return response;
    }catch(error){last=error;if(attempt<3)await sleep(attempt*700);}
  }
  throw last;
}

function basicViolations(state,status,pageErrors,failedCore){
  const out=[];
  if(!status||status>=400)out.push(`HTTP ${status??'none'}`);
  if(!state?.main?.visible)out.push('main missing/not visible');
  if(!state?.h1?.visible)out.push('h1 missing/not visible');
  if((state?.mainTextLength??0)<contract.thresholds.min_main_text_chars)out.push(`main text ${state?.mainTextLength??0}<${contract.thresholds.min_main_text_chars}`);
  if((state?.overflow??0)>contract.thresholds.horizontal_overflow_px)out.push(`horizontal overflow ${state.overflow}px`);
  if((state?.brokenImages||[]).length)out.push(`broken images ${state.brokenImages.length}`);
  if((state?.cls??0)>contract.thresholds.max_cls)out.push(`CLS ${state.cls.toFixed(3)}>${contract.thresholds.max_cls}`);
  if(pageErrors.length)out.push(`page errors ${pageErrors.length}`);
  if(failedCore.length)out.push(`failed core requests ${failedCore.length}`);
  return out;
}

async function checkOne({browserName,browser,viewportName,route,screenshotAlways=false}){
  const context=await browser.newContext({viewport:contract.viewports[viewportName]});
  const page=await context.newPage();
  await installCls(page);
  const pageErrors=[],failedCore=[],consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e?.message||e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('requestfailed',request=>{
    if(['document','script','stylesheet'].includes(request.resourceType())){
      let pathname=request.url();try{pathname=new URL(request.url()).pathname}catch{}
      failedCore.push(`${request.resourceType()}:${pathname}:${request.failure()?.errorText||''}`);
    }
  });
  let status=null,state=null,navigationError=null;
  try{
    const response=await gotoSettled(page,base+route);
    status=response?.status()??null;
    state=await inspect(page);
  }catch(error){navigationError=String(error?.message||error);}
  const violations=navigationError?[navigationError]:basicViolations(state,status,[...new Set(pageErrors)],[...new Set(failedCore)]);
  let screenshotPath=null;
  if(screenshotAlways||violations.length){
    screenshotPath=path.join(out,`${violations.length?'FAIL-':''}${browserName}-${viewportName}-${slug(route)}.png`);
    try{await page.screenshot({path:screenshotPath,fullPage:true})}catch{}
  }
  const result={browser:browserName,viewport:viewportName,route,status,state,violations,pageErrors:[...new Set(pageErrors)].slice(0,10),consoleErrors:[...new Set(consoleErrors)].slice(0,10),failedCore:[...new Set(failedCore)].slice(0,10),screenshotPath};
  await context.close();
  return result;
}

async function runInteraction(browserName,browser,interaction,route){
  const viewportName=interaction.viewport;
  const context=await browser.newContext({viewport:contract.viewports[viewportName]});
  const page=await context.newPage();
  await gotoSettled(page,base+route);
  const found=await page.evaluate(candidates=>candidates.find(selector=>document.querySelector(selector))||null,interaction.selectorCandidates);
  const violations=[];
  if(!found){violations.push(`interaction trigger missing: ${interaction.id}`);}
  else if(interaction.assert==='mobile_panel_visible'){
    const trigger=page.locator(found).first();
    await trigger.click().catch(error=>violations.push(`click failed: ${error.message}`));
    await sleep(250);
    const expanded=await trigger.getAttribute('aria-expanded').catch(()=>null);
    if(expanded!=='true')violations.push(`mobile menu did not expand: ${expanded}`);
    const panel=page.locator('#bgSharedMobileNav');
    if(await panel.count()===0)violations.push('mobile panel #bgSharedMobileNav missing');
    else{
      const hidden=await panel.getAttribute('aria-hidden').catch(()=>null);
      const visible=await panel.isVisible().catch(()=>false);
      if(hidden!=='false'||!visible)violations.push(`mobile panel not visible (aria-hidden=${hidden}, visible=${visible})`);
    }
  }else if(interaction.assert==='desktop_panel_visible'){
    const trigger=page.locator(found).first();
    await trigger.hover().catch(error=>violations.push(`hover failed: ${error.message}`));
    await sleep(180);
    const group=trigger.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " bgkop-groep ")][1]');
    const panel=group.locator('.bgkop-paneel').first();
    if(await panel.count()===0||!(await panel.isVisible().catch(()=>false)))violations.push('desktop dropdown panel not visible after hover');
  }else if(interaction.assert==='english_target_visible'){
    const trigger=page.locator(found).first();
    await trigger.click().catch(error=>violations.push(`language trigger click failed: ${error.message}`));
    await sleep(180);
    const option=page.locator('a[data-bg-language-option="en"]:visible').first();
    if(await option.count()===0)violations.push('visible English language option missing');
    else{
      const href=await option.getAttribute('href').catch(()=>null);
      const expected=route==='/'?'/en/':'/en'+route;
      let actual=null;try{actual=new URL(href,base).pathname}catch{}
      const normalizedActual=actual&&actual.length>1?actual.replace(/\/$/,''):actual;
      const normalizedExpected=expected.length>1?expected.replace(/\/$/,''):expected;
      if(normalizedActual!==normalizedExpected)violations.push(`language target mismatch: ${actual} != ${expected}`);
    }
  }
  const screenshotPath=path.join(out,`${violations.length?'FAIL-':''}${browserName}-${viewportName}-interaction-${interaction.id}-${slug(route)}.png`);
  try{await page.screenshot({path:screenshotPath,fullPage:true})}catch{}
  await context.close();
  return{browser:browserName,viewport:viewportName,route,interaction:interaction.id,violations,screenshotPath};
}

const routes=await readRoutes();
const results=[],interactions=[];
const failures=[];

// Full sitemap responsive sweep in Chromium using bounded parallel workers.
const configuredAllRouteViewports=(process.env.ASSURANCE_MODE==='daily'?contract.daily_all_route_viewports:contract.pr_all_route_viewports);
const allRouteViewports=configuredAllRouteViewports||contract.all_route_sweep.viewports;
for(const viewportName of allRouteViewports){
  const workerCount=Math.min(6,Math.max(1,Number(process.env.ASSURANCE_WORKERS||6)));
  let cursor=0,completed=0;
  await Promise.all(Array.from({length:workerCount},async()=>{
    const browser=await chromium.launch({headless:true});
    try{
      while(true){
        const index=cursor++;
        if(index>=routes.length)break;
        const route=routes[index];
        const result=await checkOne({browserName:'chromium',browser,viewportName,route,screenshotAlways:contract.screenshot_matrix.routes.includes(route)});
        results.push(result);if(result.violations.length)failures.push(result);
        completed++;
        if(completed%25===0||completed===routes.length)console.log(`all-route chromium ${viewportName}: ${completed}/${routes.length}`);
      }
    }finally{await browser.close();}
  }));
}

// Critical screenshot matrix on all engines and all viewports.
for(const browserName of contract.screenshot_matrix.browsers){
  const engine=engines[browserName];
  for(const viewportName of contract.screenshot_matrix.viewports){
    const browser=await engine.launch({headless:true});
    try{
      for(const route of contract.screenshot_matrix.routes){
        const already=browserName==='chromium'&&contract.all_route_sweep.viewports.includes(viewportName);
        if(already)continue;
        const result=await checkOne({browserName,browser,viewportName,route,screenshotAlways:true});
        results.push(result);if(result.violations.length)failures.push(result);
      }
      for(const interaction of contract.interactions.filter(i=>i.viewport===viewportName)){
        for(const route of interaction.routes){
          const result=await runInteraction(browserName,browser,interaction,route);
          interactions.push(result);if(result.violations.length)failures.push(result);
        }
      }
    }finally{await browser.close();}
  }
}

const report={version:contract.version,generatedAt:new Date().toISOString(),baseUrl:base,routeCount:routes.length,resultCount:results.length,interactionCount:interactions.length,failures:failures.length,results,interactions};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({version:report.version,routeCount:report.routeCount,resultCount:report.resultCount,interactionCount:report.interactionCount,failures:failures.length,failed:failures.slice(0,50).map(x=>({browser:x.browser,viewport:x.viewport,route:x.route,interaction:x.interaction||null,violations:x.violations}))},null,2));
if(failures.length)process.exitCode=1;
