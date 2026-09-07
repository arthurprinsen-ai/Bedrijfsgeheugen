import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.UI_VR_BASE_URL || 'https://www.bedrijfsgeheugen.nl';
const labels = ['BEDRIJF', 'KENNIS', 'VERTROUWEN', 'SUPPORT'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
try {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90_000 });
  const meer = page.getByRole('button', { name: /^Meer(?:\s*▼)?$/i }).first();
  await meer.waitFor({ state: 'visible', timeout: 30_000 });
  await meer.click();
  await page.waitForTimeout(250);

  const result = await page.evaluate((expectedLabels) => {
    const visible = (el) => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0; };
    const norm = (v) => String(v||'').replace(/\s+/g,' ').trim().toUpperCase();
    const inMenu = (el) => { let n=el.parentElement; for(let d=0;n&&d<8;d+=1,n=n.parentElement){const t=norm(n.textContent);if(t.includes('MENSEN EERST. DAN TECHNIEK.')&&t.includes('VOLLEDIGE WEBSITEKAART'))return true;} return false; };
    const isPromoLink = (el) => { const t=norm(el.textContent); return t.includes('MENSEN EERST. DAN TECHNIEK.')||t.includes('BEDRIJFSGEHEUGEN'); };

    const headings = expectedLabels.map((label)=>{
      const el=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].find((node)=>norm(node.textContent)===label&&visible(node)&&inMenu(node));
      if(!el)return{label,found:false};
      const s=getComputedStyle(el);
      return{label,found:true,color:s.color,fontWeight:s.fontWeight,tag:el.tagName,className:el.className};
    });

    const ordinaryLinks = [...document.querySelectorAll('a')]
      .filter((el)=>visible(el)&&inMenu(el)&&!isPromoLink(el))
      .map((el)=>{const s=getComputedStyle(el);return{text:norm(el.textContent),color:s.color,fontWeight:s.fontWeight,marked:el.hasAttribute('data-bg-megamenu-link')};});

    return { headings, ordinaryLinks };
  }, labels);

  for (const item of result.headings) {
    assert.equal(item.found, true, `${item.label}: visible real-menu heading not found`);
    assert.equal(item.color, 'rgb(0, 0, 0)', `${item.label}: expected black, got ${item.color}`);
    assert.ok(Number.parseInt(item.fontWeight,10)>=700, `${item.label}: expected bold >=700, got ${item.fontWeight}`);
  }

  assert.ok(result.ordinaryLinks.length >= 8, `expected ordinary mega-menu links, found ${result.ordinaryLinks.length}`);
  for (const item of result.ordinaryLinks) {
    assert.equal(item.marked, true, `${item.text}: missing contrast marker`);
    assert.equal(item.color, 'rgb(0, 0, 0)', `${item.text}: expected black, got ${item.color}`);
    assert.ok(Number.parseInt(item.fontWeight,10)>=700, `${item.text}: expected bold >=700, got ${item.fontWeight}`);
  }

  console.log('V18 megamenu contrast browser contract passed:', JSON.stringify(result));
} finally { await browser.close(); }
