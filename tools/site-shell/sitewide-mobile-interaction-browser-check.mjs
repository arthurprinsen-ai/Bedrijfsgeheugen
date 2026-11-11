import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base=(process.env.UI_VR_BASE_URL||'https://www.bedrijfsgeheugen.nl').replace(/\/$/,'');
const pairs=[
  {route:'/',width:390},
  {route:'/kennis/',width:390},
  {route:'/prijzen',width:390},
  {route:'/contact',width:390},
  {route:'/',width:320},
  {route:'/kennis/',width:320}
];
const out='.artifacts/sitewide-mobile-interactions-20261111';
await fs.mkdir(out,{recursive:true});

function rgb(value){
  const m=String(value||'').match(/rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
  return m?[Number(m[1]),Number(m[2]),Number(m[3])]:null;
}
function luminance(rgb){
  const channels=rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function ratio(a,b){
  return (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
}
const browser=await chromium.launch({headless:true});
const results=[];
let failures=0;
try {
  for(const {route,width} of pairs) {
    const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e?.message||e)));
    const label=route.replace(/[^a-z0-9]/gi,'-')||'home';
    try {
      const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
      assert.ok(response && response.status()<400,`${route} HTTP ${response?.status()}`);
      const toggle=page.locator('#bgkopKnop:visible, #mobileToggle:visible').first();
      await toggle.waitFor({state:'visible',timeout:15000});
      await page.waitForTimeout(200);
      const header=page.locator('header.v17-header:visible, nav.bgkop:visible').first();
      assert.ok(await header.count(),`${route} visible header absent`);
      await toggle.click({timeout:10000});
      assert.equal(await toggle.getAttribute('aria-expanded'),'true',`${route}: menu did not open`);
      const controls=await toggle.getAttribute('aria-controls');
      assert.ok(controls && /^(bgMobileNav|bgSharedMobileNav|v18MobileDrawer)$/.test(controls),`${route}: wrong menu owner: ${controls}`);
      const nav=page.locator('#'+controls);
      await nav.waitFor({state:'visible',timeout:8000});
      assert.equal(await nav.getAttribute('aria-hidden'),'false',`${route}: open menu aria mismatch`);
      const close=nav.locator('[data-bg-sitewide-close]').first();
      await close.waitFor({state:'visible',timeout:5000});
      await close.click({timeout:7000});
      assert.equal(await toggle.getAttribute('aria-expanded'),'false',`${route}: explicit close did not collapse`);
      assert.equal(await nav.getAttribute('aria-hidden'),'true',`${route}: close left overlay active`);
      const unlocked=await page.evaluate(()=>document.body.style.overflow===''&&document.documentElement.style.overflow==='');
      assert.equal(unlocked,true,`${route}: scroll remains locked after menu close`);

      await toggle.click({timeout:10000});
      assert.equal(await toggle.getAttribute('aria-expanded'),'true',`${route}: menu cannot reopen`);
      await page.keyboard.press('Escape');
      assert.equal(await nav.getAttribute('aria-hidden'),'true',`${route}: Escape did not dismiss menu`);

      const sticky=await page.evaluate(async()=>{
        const header=document.querySelector('header.v17-header,nav.bgkop');
        if(document.documentElement.scrollHeight-innerHeight<250)return {short:true};
        // The public pages enable smooth scrolling. Measure only after a real
        // completed scroll frame; an immediate read reports the initial 41px
        // announcement offset, not the sticky header's settled position.
        document.documentElement.style.scrollBehavior='auto';
        window.scrollTo({top:Math.min(800,document.documentElement.scrollHeight-innerHeight),behavior:'instant'});
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        return {
          scrollY:window.scrollY,
          top:header.getBoundingClientRect().top,
          position:getComputedStyle(header).position,
          overflow:document.documentElement.scrollWidth-innerWidth
        };
      });
      assert.ok(sticky.short||(sticky.scrollY>200&&sticky.position==='sticky'&&Math.abs(sticky.top)<5),`${route}: header fails settled scroll sticky: ${JSON.stringify(sticky)}`);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(overflow<=4,`${route}: horizontal overflow ${overflow}px at ${width}px`);

      if(route==='/'){
        const cta=page.locator('.pgl .pgl-actions a.pgl-btn.secondary').first();
        await cta.waitFor({state:'attached',timeout:10000});
        const colors=await cta.evaluate(node=>{
          const s=getComputedStyle(node);
          return {text:node.textContent.trim(),fg:s.color,bg:s.backgroundColor};
        });
        assert.ok(colors.text.length>=4,'homepage secondary CTA has no readable label');
        const fg=rgb(colors.fg),bg=rgb(colors.bg);
        assert.ok(fg&&bg,'homepage secondary CTA computed colors missing');
        assert.ok(ratio(fg,bg)>=4.5,`homepage secondary CTA contrast below 4.5:1, ${JSON.stringify(colors)}`);
      }
      if(route==='/kennis/'){
        const frame=page.locator('#compareFrame'),range=page.locator('#compareRange');
        await range.waitFor({state:'visible',timeout:10000});
        const geometry=await page.evaluate(()=>{
          const frame=document.getElementById('compareFrame'),range=document.getElementById('compareRange');
          const a=frame?.getBoundingClientRect(),b=range?.getBoundingClientRect();
          return {parent:range?.parentElement?.id,frameWidth:a?.width,rangeWidth:b?.width,frameHeight:a?.height,rangeHeight:b?.height};
        });
        assert.equal(geometry.parent,'compareFrame','knowledge range must own visual frame');
        assert.ok(geometry.rangeWidth>=geometry.frameWidth*.9,'knowledge range touch width does not cover frame');
        await range.focus();
        await range.press('Home');
        assert.equal(Number(await range.inputValue()),0,'knowledge slider Home is not left physical endpoint');
        assert.equal(await frame.getAttribute('data-bg-knowledge-side'),'before','knowledge slider left view not readable');
        await range.press('End');
        assert.equal(Number(await range.inputValue()),100,'knowledge slider End is not right physical endpoint');
        assert.equal(await frame.getAttribute('data-bg-knowledge-side'),'after','knowledge slider right view not readable');
        await range.press('Home');
        const box=await range.boundingBox();
        assert.ok(box && box.width>100 && box.height>100,'knowledge range lacks large visible touch target');
        await range.click({position:{x:Math.floor(box.width*.65),y:Math.floor(box.height*.5)},timeout:10000});
        const clicked=Number(await range.inputValue());
        assert.ok(clicked>0&&clicked<100,`knowledge visual frame did not respond to pointer click: ${clicked}`);
      }
      assert.deepEqual(errors.slice(0,5),[],`${route}: uncaught script errors ${errors.slice(0,5).join(' | ')}`);
      results.push({route,width,status:'PASS',menu:'open-close-escape',header:'sticky',contrast:route==='/'?'PASS':null,slider:route==='/kennis/'?'0-100-keyboard-and-pointer':null});
    }catch(error){
      failures++;
      const message=String(error?.message||error);
      results.push({route,width,status:'FAIL',error:message.slice(0,700)});
      await page.screenshot({path:path.join(out,`FAIL-${width}-${label}.png`),fullPage:false}).catch(()=>{});
    }finally{
      await context.close();
    }
  }
}finally{
  await browser.close();
}
const report={contract:'PUBLIC_MOBILE_INTERACTION_PR_READBACK_20261111',base,failures,results};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('PUBLIC_MOBILE_INTERACTION_PR_READBACK',JSON.stringify(report));
if(failures)process.exitCode=1;
