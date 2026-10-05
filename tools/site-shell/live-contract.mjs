import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { GLOBAL_COMPONENTS, componentHash, verifyPageShell } from './contracts.mjs';
import { readReleaseMarker } from './release-marker.mjs';

const TRUST = ['Vaste prijs, geen uurtje-factuurtje', 'In twee weken draaiend', 'Voor het Nederlandse mkb'];
const MOBILE = ['Oplossingen', 'Platform', 'Prijzen', 'Kennis', 'Over ons', 'Meer'];
const CONTACT = ['mailto:arthur@bedrijfsgeheugen.nl', 'tel:+31627483345', 'ma–vr 08:00–18:00'];

function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function hasAttrValue(html, attr, value) {
  const re = new RegExp(`<[^>]+\\b${esc(attr)}=(?:"${esc(value)}"|'${esc(value)}')[^>]*>`, 'i');
  return re.test(String(html));
}
function hasId(html, id) {
  const re = new RegExp(`<[^>]+\\bid=(?:"${esc(id)}"|'${esc(id)}')[^>]*>`, 'i');
  return re.test(String(html));
}
function beforeFooter(html) {
  const i = String(html).search(/<footer\b/i);
  return i < 0 ? String(html) : String(html).slice(0, i);
}
function textContent(node) {
  if (!node) return '';
  if (node.nodeName === '#text') return String(node.value || '');
  return (node.childNodes || []).map(textContent).join('');
}
function headingTexts(html, tag='h3') {
  const doc=parse(String(html));
  const out=[];
  const walk=node=>{
    if(node?.tagName===tag) out.push(textContent(node).replace(/\s+/g,' ').trim());
    for(const child of node?.childNodes||[]) walk(child);
  };
  walk(doc);
  return out;
}

function verifyOne(html, path, expectedCommit, pricing = false) {
  assert.equal(readReleaseMarker(html), expectedCommit, `${path}: release marker wijkt af van productiecommit`);
  for (const text of TRUST) assert.ok(html.includes(text), `${path}: trustbalk mist “${text}”`);
  for (const text of MOBILE) assert.ok(html.includes(text), `${path}: mobiel menu mist “${text}”`);
  for (const token of CONTACT) assert.ok(!beforeFooter(html).includes(token), `${path}: contactgegeven staat buiten footer: ${token}`);

  if (pricing) {
    for (const [attr, value] of [['href', '#saas'],['href', '#expertise']]) {
      assert.ok(hasAttrValue(html, attr, value), `${path}: canonieke pricing-navigatie ontbreekt: ${attr}=${value}`);
    }
    for (const id of ['saas', 'expertise']) {
      assert.ok(hasId(html, id), `${path}: canonieke pricing-sectie ontbreekt live: #${id}`);
    }
    const headings=new Set(headingTexts(html));
    for (const plan of ['Starter', 'Pro', 'Groei', 'Enterprise']) {
      assert.ok(headings.has(plan), `${path}: canoniek SaaS-pakket ontbreekt live: ${plan}`);
    }
    for (const token of ['€ 99', '€ 299', '€ 749', 'Op maat']) {
      assert.ok(html.includes(token) || html.includes(token.replace(' ',' ')), `${path}: canonieke SaaS-prijs ontbreekt live: ${token}`);
    }
    for (const service of ['Frisse Blik', 'Directie & AI Workshop', 'Bedrijfsgeheugen Scan', 'Build Sprint', 'Transformation / Fractional Lead']) {
      assert.ok(headings.has(service), `${path}: canonieke consulting-propositie ontbreekt live: ${service}`);
    }
    for (const id of ['pkgSize', 'pkgGoal', 'pkgMode', 'pkgGo']) {
      assert.ok(hasId(html, id), `${path}: canonieke pakketadvies-control ontbreekt live: #${id}`);
    }
    assert.ok(hasAttrValue(html, 'href', '/pakketadvies') || html.includes('bedrijfsgeheugen.nl/pakketadvies'), `${path}: pakketadvies-route ontbreekt live`);

    assert.ok(!html.includes('data-bg-billing="monthly"'), `${path}: retired billing-toggle contract staat live`);
    assert.ok(!html.includes('data-bg-billing="yearly"'), `${path}: retired billing-toggle contract staat live`);
    assert.ok(!headings.has('Build'), `${path}: retired Build-pakket staat live`);
    assert.ok(!headings.has('Transform'), `${path}: retired Transform-pakket staat live`);
  }
  verifyPageShell(html, path);
}

export function verifyLiveSite({ home, pricing, content, expectedCommit }) {
  assert.ok(expectedCommit && expectedCommit !== 'local', 'expectedCommit is verplicht voor live readback');
  const pages = [
    { path: 'index.html', html: String(home), pricing: false },
    { path: 'prijzen.html', html: String(pricing), pricing: true },
    { path: 'over-ons.html', html: String(content), pricing: false }
  ];
  for (const p of pages) verifyOne(p.html, p.path, expectedCommit, p.pricing);
  const base = new Map();
  for (const p of pages) {
    for (const name of GLOBAL_COMPONENTS) {
      const hash = componentHash(p.html, name);
      if (!base.has(name)) base.set(name, hash);
      else assert.equal(hash, base.get(name), `${p.path}: ${name} verschilt live van homepage`);
    }
  }
  return Object.fromEntries(base);
}
