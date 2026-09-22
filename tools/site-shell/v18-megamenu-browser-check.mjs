import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseUrl = process.env.UI_VR_BASE_URL || 'https://www.bedrijfsgeheugen.nl';
const labels = ['BEDRIJF', 'KENNIS', 'VERTROUWEN', 'SUPPORT'];
const maxAttempts = Number.parseInt(process.env.MEGAMENU_CHECK_ATTEMPTS || '12', 10);
const retryDelayMs = Number.parseInt(process.env.MEGAMENU_CHECK_RETRY_MS || '5000', 10);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const routes = (process.env.MEGAMENU_ROUTES || '/,/wijzigingen,/prijzen,/product,/kennis/,/over-ons')
  .split(',')
  .map(route => route.trim())
  .filter(Boolean);

async function openVisibleMegamenu(page) {
  const candidates = page.getByText(/^Meer(?:\s*▼)?$/i, { exact: true });
  const count = await candidates.count();
  let lastClickError;

  for (let i = 0; i < count; i += 1) {
    const candidate = candidates.nth(i);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    try {
      await candidate.click({ timeout: 3000 });
      await page.waitForTimeout(250);
      const menuVisible = await page.evaluate(() => {
        const visible = (el) => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0; };
        const norm = (v) => String(v||'').replace(/\s+/g,' ').trim().toUpperCase();
        return [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')]
          .some((el) => norm(el.textContent)==='BEDRIJF' && visible(el));
      });
      if (menuVisible) return;
    } catch (error) {
      lastClickError = error;
    }
  }

  throw lastClickError || new Error(`visible Meer trigger not found/openable; candidates=${count}`);
}

async function inspectMegamenu(page, route = '/') {
  const url = new URL(route, baseUrl).href;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await openVisibleMegamenu(page);

  return page.evaluate((expectedLabels) => {
    const visible = (el) => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0; };
    const norm = (v) => String(v||'').replace(/\s+/g,' ').trim().toUpperCase();
    const hasMenuContract = (node) => {
      const text=norm(node&&node.textContent);
      return text.includes('MENSEN EERST. DAN TECHNIEK.')
        && text.includes('VOLLEDIGE WEBSITEKAART')
        && expectedLabels.every(label => text.includes(label));
    };
    const findMenuRoot = () => {
      const bedrijfsHeading=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')]
        .find((node)=>norm(node.textContent)==='BEDRIJF'&&visible(node));
      if(!bedrijfsHeading)return null;
      let node=bedrijfsHeading.parentElement;
      while(node&&node!==document.body&&node!==document.documentElement){
        if(hasMenuContract(node))return node;
        node=node.parentElement;
      }
      return null;
    };
    const isPromoLink = (el) => { const t=norm(el.textContent); return t.includes('MENSEN EERST. DAN TECHNIEK.')||t.includes('BEDRIJFSGEHEUGEN'); };
    const root=findMenuRoot();
    if(!root)return { headings: expectedLabels.map(label=>({label,found:false})), ordinaryLinks: [], rootFound:false, geometry:null, navLabels:[] };

    const headings = expectedLabels.map((label)=>{
      const el=[...root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].find((node)=>norm(node.textContent)===label&&visible(node));
      if(!el)return{label,found:false};
      const s=getComputedStyle(el);
      return{label,found:true,color:s.color,fontWeight:s.fontWeight,tag:el.tagName,className:el.className};
    });

    const ordinaryLinks = [...root.querySelectorAll('a')]
      .filter((el)=>visible(el)&&!isPromoLink(el))
      .map((el)=>{
        const s=getComputedStyle(el);
        const descendants=[...el.querySelectorAll('*')].filter(visible).map((child)=>{const cs=getComputedStyle(child);return{tag:child.tagName,color:cs.color,fontWeight:cs.fontWeight};});
        return{text:norm(el.textContent),color:s.color,fontWeight:s.fontWeight,marked:el.hasAttribute('data-bg-megamenu-link'),descendants};
      });

    const rect=root.getBoundingClientRect();
    const navLabels=[...document.querySelectorAll('header.v17-header .navbtn,header.v17-header a[data-view]')]
      .filter(visible)
      .map(el=>norm(el.textContent));
    return {
      headings,
      ordinaryLinks,
      rootFound:true,
      geometry:{
        left:Math.round(rect.left*10)/10,
        right:Math.round(rect.right*10)/10,
        width:Math.round(rect.width*10)/10
      },
      navLabels
    };
  }, labels);
}

function assertParity(reference, current, route) {
  assert.ok(reference.geometry && current.geometry, `${route}: missing mega-menu geometry`);
  assert.ok(Math.abs(reference.geometry.width-current.geometry.width)<=2,
    `${route}: mega-menu width drifted: ${current.geometry.width}px vs ${reference.geometry.width}px`);
  assert.ok(Math.abs(reference.geometry.left-current.geometry.left)<=2,
    `${route}: mega-menu left edge drifted: ${current.geometry.left}px vs ${reference.geometry.left}px`);
  assert.deepEqual(current.navLabels, reference.navLabels, `${route}: desktop navigation differs from homepage`);
}

function assertMegamenu(result) {
  assert.equal(result.rootFound, true, 'actual V18 megamenu root not found');
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
    for (const child of item.descendants) {
      assert.equal(child.color, 'rgb(0, 0, 0)', `${item.text}/${child.tag}: expected black, got ${child.color}`);
      assert.ok(Number.parseInt(child.fontWeight,10)>=700, `${item.text}/${child.tag}: expected bold >=700, got ${child.fontWeight}`);
    }
  }
}

const browser = await chromium.launch({ headless: true });
let lastError;
try {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const pages = [];
    try {
      let reference = null;
      const routeResults = [];
      for (const route of routes) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        pages.push(page);
        const result = await inspectMegamenu(page, route);
        assertMegamenu(result);
        if (!reference) reference = result;
        else assertParity(reference, result, route);
        routeResults.push({ route, geometry: result.geometry, navLabels: result.navLabels });
      }
      console.log(`V18 megamenu sitewide contract passed on attempt ${attempt}:`, JSON.stringify(routeResults));
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      console.warn(`V18 megamenu check attempt ${attempt}/${maxAttempts} failed: ${error?.message || error}`);
      if (attempt < maxAttempts) await sleep(retryDelayMs);
    } finally {
      for (const page of pages) await page.close();
    }
  }
  if (lastError) throw lastError;
} finally {
  await browser.close();
}
