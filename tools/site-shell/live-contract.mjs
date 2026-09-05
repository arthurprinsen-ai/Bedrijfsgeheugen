import assert from 'node:assert/strict';
import { GLOBAL_COMPONENTS, componentHash, verifyPageShell } from './contracts.mjs';
import { readReleaseMarker } from './release-marker.mjs';

const TRUST = ['Vaste prijs, geen uurtje-factuurtje', 'In twee weken draaiend', 'Voor het Nederlandse mkb'];
const MOBILE = ['ONTDEKKEN', 'KENNIS & BEDRIJF', 'START'];
const CONTACT = ['mailto:arthur@bedrijfsgeheugen.nl', 'tel:+31627483345', 'ma–vr 08:00–18:00'];
const PRICING = ['bgx-vraagbalk', 'bgx-rekenaar', 'bgx-rol'];

function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function hasClassElement(html, cls) {
  const re = new RegExp(`<[^>]+class=(?:"[^"]*\\b${esc(cls)}\\b[^"]*"|'[^']*\\b${esc(cls)}\\b[^']*')[^>]*>`, 'i');
  return re.test(String(html));
}

function beforeFooter(html) {
  const i = String(html).search(/<footer\b/i);
  return i < 0 ? String(html) : String(html).slice(0, i);
}

function verifyOne(html, path, expectedCommit, pricing = false) {
  assert.equal(readReleaseMarker(html), expectedCommit, `${path}: release marker wijkt af van productiecommit`);
  for (const text of TRUST) assert.ok(html.includes(text), `${path}: trustbalk mist “${text}”`);
  for (const text of MOBILE) assert.ok(html.includes(text), `${path}: mobiel menu mist “${text}”`);
  for (const token of CONTACT) assert.ok(!beforeFooter(html).includes(token), `${path}: contactgegeven staat buiten footer: ${token}`);

  if (pricing) {
    for (const cls of PRICING) assert.ok(hasClassElement(html, cls), `${path}: pricing-tool ontbreekt: ${cls}`);
    assert.ok(!/id="bgkopMob"/i.test(html), `${path}: legacy pricing mobile menu staat live`);
    assert.ok(!/class="[^"]*\bbgkop\b/i.test(html), `${path}: legacy pricing header staat live`);
  } else {
    for (const cls of PRICING) assert.ok(!hasClassElement(html, cls), `${path}: pricing-tool staat buiten prijzen: ${cls}`);
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
