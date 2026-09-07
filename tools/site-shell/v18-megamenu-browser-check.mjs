import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.UI_VR_BASE_URL || 'https://www.bedrijfsgeheugen.nl';
const labels = ['BEDRIJF', 'KENNIS', 'VERTROUWEN', 'SUPPORT'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const openMeer = async (path) => {
  await page.goto(new URL(path, baseUrl).href, { waitUntil: 'networkidle', timeout: 90_000 });
  const meer = page.getByRole('button', { name: /^Meer(?:\s*▼)?$/i }).first();
  await meer.waitFor({ state: 'visible', timeout: 30_000 });
  await meer.click();
  await page.waitForTimeout(250);
};

try {
  await openMeer('/benchmark');

  const result = await page.evaluate((expectedLabels) => {
    const visible = (el) => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0; };
    const norm = (v) => String(v||'').replace(/\s+/g,' ').trim().toUpperCase();
    const inMenu = (el) => { let n=el; for(let d=0;n&&d<9;d+=1,n=n.parentElement){const t=norm(n.textContent);if(t.includes('MENSEN EERST. DAN TECHNIEK.')&&t.includes('VOLLEDIGE WEBSITEKAART'))return true;} return false; };
    const headings = expectedLabels.map((label)=>{const el=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].find((node)=>norm(node.textContent)===label&&visible(node)&&inMenu(node));if(!el)return{label,found:false};const s=getComputedStyle(el);return{label,found:true,color:s.color,fontWeight:s.fontWeight,opacity:s.opacity};});
    const benchmark = [...document.querySelectorAll('a[href]')].find((node)=>norm(node.textContent).startsWith('BENCHMARK')&&visible(node)&&inMenu(node));
    if (!benchmark) return { headings, benchmark: { found:false } };
    const ownTextElements = [benchmark,...benchmark.querySelectorAll('*')].filter((el)=>visible(el)&&[...el.childNodes].some((node)=>node.nodeType===Node.TEXT_NODE&&String(node.textContent||'').trim()));
    return {
      headings,
      benchmark: {
        found:true,
        ariaCurrent:benchmark.getAttribute('aria-current'),
        markedCurrent:benchmark.getAttribute('data-bg-megamenu-current'),
        background:getComputedStyle(benchmark).backgroundColor,
        textStyles:ownTextElements.map((el)=>({text:String(el.textContent||'').replace(/\s+/g,' ').trim(),color:getComputedStyle(el).color,opacity:getComputedStyle(el).opacity}))
      }
    };
  }, labels);

  for (const item of result.headings) {
    assert.equal(item.found, true, `${item.label}: visible real-menu heading not found`);
    assert.equal(item.color, 'rgb(0, 0, 0)', `${item.label}: expected black, got ${item.color}`);
    assert.ok(Number.parseInt(item.fontWeight,10)>=700, `${item.label}: expected bold >=700, got ${item.fontWeight}`);
    assert.equal(item.opacity, '1', `${item.label}: expected full opacity`);
  }

  assert.equal(result.benchmark.found, true, 'Benchmark current-page menu link not found');
  assert.equal(result.benchmark.markedCurrent, 'true', 'Benchmark must be marked as the current megamenu item');
  assert.equal(result.benchmark.background, 'rgb(238, 242, 247)', `Benchmark current tile must have a readable opaque background, got ${result.benchmark.background}`);
  assert.ok(result.benchmark.textStyles.length > 0, 'Benchmark current tile exposes no visible text nodes');
  for (const item of result.benchmark.textStyles) {
    assert.equal(item.color, 'rgb(17, 24, 39)', `Benchmark text "${item.text}" must be dark, got ${item.color}`);
    assert.equal(item.opacity, '1', `Benchmark text "${item.text}" must be fully opaque`);
  }

  console.log('V18 megamenu heading + current-link contrast contract passed:', JSON.stringify(result));
} finally {
  await browser.close();
}
