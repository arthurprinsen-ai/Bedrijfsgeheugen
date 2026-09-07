import { chromium } from 'playwright';

const baseUrl = process.env.UI_VR_BASE_URL;
if (!baseUrl) throw new Error('UI_VR_BASE_URL ontbreekt');

const GUTTER_MIN = 24;
const MIN_VISIBLE_COPY = 220;

function fail(message, evidence = {}) { throw new Error(`${message}\n${JSON.stringify(evidence, null, 2)}`); }

async function readGeometry(page) {
  return page.evaluate(() => {
    const slider = document.querySelector('#compareSlider');
    const before = slider?.querySelector('.compare-before .compare-copy');
    const after = slider?.querySelector('.compare-after .compare-copy');
    const knob = slider?.querySelector('.compare-knob');
    if (!slider || !before || !after || !knob) return null;
    const sr = slider.getBoundingClientRect(), br = before.getBoundingClientRect(), ar = after.getBoundingClientRect();
    const split = parseFloat(getComputedStyle(slider).getPropertyValue('--split')) || 50;
    const dividerX = sr.left + sr.width * split / 100;
    const visible = el => { const cs=getComputedStyle(el), r=el.getBoundingClientRect(); return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>0&&r.height>0; };
    return { slider:{left:sr.left,right:sr.right,top:sr.top,bottom:sr.bottom,width:sr.width,height:sr.height}, before:{left:br.left,right:br.right,width:br.width,visible:visible(before)}, after:{left:ar.left,right:ar.right,width:ar.width,visible:visible(after)}, dividerX, split, compact:slider.getAttribute('data-bg-compare-compact'), aria:{min:Number(knob.getAttribute('aria-valuemin')),max:Number(knob.getAttribute('aria-valuemax')),now:Number(knob.getAttribute('aria-valuenow'))}, handleDisplay:getComputedStyle(slider.querySelector('.compare-handle')||knob).display, beforeHeadingVisible:visible(before.querySelector('h3')), beforeParagraphVisible:visible(before.querySelector('p')), afterHeadingVisible:visible(after.querySelector('h3')), afterParagraphVisible:visible(after.querySelector('p')) };
  });
}

function assertDesktopGeometry(g,label){
  if(!g) fail(`${label}: compareSlider of tekstlagen ontbreken`);
  if(g.compact!=='false') fail(`${label}: desktop mag niet in compact fallback staan`,g);
  if(!g.before.visible||!g.after.visible||!g.beforeHeadingVisible||!g.beforeParagraphVisible||!g.afterHeadingVisible||!g.afterParagraphVisible) fail(`${label}: beide tekstlagen moeten volledig zichtbaar zijn`,g);
  const leftClearance=g.dividerX-g.before.right,rightClearance=g.after.left-g.dividerX;
  if(g.before.width<MIN_VISIBLE_COPY||g.after.width<MIN_VISIBLE_COPY) fail(`${label}: tekstkolom is smaller dan ${MIN_VISIBLE_COPY}px`,g);
  if(leftClearance<GUTTER_MIN||rightClearance<GUTTER_MIN) fail(`${label}: handle/scheidingslijn overlapt de tekst`,{...g,leftClearance,rightClearance});
  if(!(g.aria.now>=g.aria.min&&g.aria.now<=g.aria.max)) fail(`${label}: ARIA-waarde ligt buiten dezelfde veilige grens`,g);
}

async function dragKnobTo(page,targetX){
  const knob=page.locator('#compareSlider .compare-knob'); await knob.scrollIntoViewIfNeeded(); const b=await knob.boundingBox(); if(!b) fail('sliderknop heeft geen geometry');
  const x=b.x+b.width/2,y=b.y+b.height/2; await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(targetX,y,{steps:8}); await page.mouse.up(); await page.waitForTimeout(120);
}

async function testDesktop(browser){
  const page=await browser.newPage({viewport:{width:1128,height:653}}); await page.goto(`${baseUrl}/`,{waitUntil:'networkidle'}); const slider=page.locator('#compareSlider'); await slider.waitFor({state:'visible'}); await page.waitForFunction(()=>document.querySelector('#compareSlider')?.hasAttribute('data-bg-compare-compact')); await slider.scrollIntoViewIfNeeded(); await page.waitForTimeout(120); const box=await slider.boundingBox(); if(!box) fail('compareSlider heeft geen geometry');
  await dragKnobTo(page,box.x+2); const left=await readGeometry(page); assertDesktopGeometry(left,'1128x653 uiterste links');
  await dragKnobTo(page,box.x+box.width-2); const right=await readGeometry(page); assertDesktopGeometry(right,'1128x653 uiterste rechts');
  if(!(left.split<50&&right.split>50)) fail('Desktop slider moet via de echte witte knop interactief blijven binnen de veilige zone',{left,right}); await page.close(); return {left:left.split,right:right.split};
}

async function testMobile(browser){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}); await page.goto(`${baseUrl}/`,{waitUntil:'networkidle'}); const slider=page.locator('#compareSlider'); await slider.waitFor({state:'visible'}); await page.waitForFunction(()=>document.querySelector('#compareSlider')?.hasAttribute('data-bg-compare-compact')); await slider.scrollIntoViewIfNeeded(); const g=await readGeometry(page); if(!g) fail('390px: compareSlider of tekstlagen ontbreken'); if(g.compact!=='true') fail('390px: smalle viewport moet fail-safe naar compact mode',g); if(!g.before.visible||!g.after.visible||!g.beforeHeadingVisible||!g.beforeParagraphVisible||!g.afterHeadingVisible||!g.afterParagraphVisible) fail('390px: beide gestapelde teksten moeten zichtbaar zijn',g); if(g.before.width<250||g.after.width<250) fail('390px: gestapelde tekstkolommen zijn te smal',g); if(g.handleDisplay!=='none') fail('390px: onbruikbare handle moet verborgen zijn',g); await page.close(); return {beforeWidth:g.before.width,afterWidth:g.after.width,compact:g.compact};
}

const browser=await chromium.launch({headless:true});
try { console.log(JSON.stringify({ok:true,component:'#compareSlider',desktop:await testDesktop(browser),mobile:await testMobile(browser)})); } finally { await browser.close(); }
