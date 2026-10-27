import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pdf=readFileSync(new URL('../assets/downloads/7-verborgen-bedrijfslekken.pdf',import.meta.url),'latin1');
const landing=readFileSync(new URL('../pages/7-bedrijfslekken.html',import.meta.url),'utf8');
const scan=readFileSync(new URL('../zelfscan.html',import.meta.url),'utf8');
const redirects=readFileSync(new URL('../_redirects',import.meta.url),'utf8');
const skill=readFileSync(new URL('../skills/powerhouse-product-led-growth.md',import.meta.url),'utf8');

test('historical replay: truly ungated gratis PDF remains usable and downloadable',()=>{
  assert.match(pdf,/^%PDF-1\.4/);
  assert.equal((pdf.match(/\/Type \/Page /g)||[]).length,4);
  const xref=Number(pdf.match(/startxref\n(\d+)/)?.[1]);
  assert.ok(Number.isInteger(xref)&&xref>100);
  assert.equal(pdf.slice(xref,xref+5),'xref\n');
  assert.match(pdf,/%%EOF\s*$/);
  assert.match(landing,/href="\/assets\/downloads\/7-verborgen-bedrijfslekken\.pdf"/);
  assert.match(landing,/geen e-mailadres nodig/i);
  assert.doesNotMatch(landing,/<form\b/i);
});

test('shadow: route continues the existing first-party selfscan and not a parallel portal',()=>{
  assert.match(redirects,/^\/7-bedrijfslekken\s+\/pages\/7-bedrijfslekken\.html\s+200$/m);
  assert.match(scan,/Laat zien waar mijn bedrijf lekt/);
  assert.match(scan,/Geen formulier, geen e-mailmuur/);
  assert.match(landing,/\/zelfscan\?utm_source=werkboek/);
  assert.match(landing,/\/frisse-blik/);
  assert.doesNotMatch(landing,/nouveaux|fake.*scarcity|nog maar 3 plekken/i);
});

test('canary: authority, reciprocity and truthful value evidence precede checkout',()=>{
  assert.match(skill,/Revenue-first reciprocal offer/);
  assert.match(skill,/reciprocity/i);
  assert.match(skill,/paid_order/);
  assert.match(skill,/realized_revenue/);
  assert.match(skill,/P0 #4198/);
  assert.match(landing,/Geen e-mail nodig|Zonder account, e-mailadres/i);
  assert.match(landing,/Dat is nog geen gerealiseerde omzet of besparing/i);
});

test('attribution contract: no invented conversion for file downloads or clicks',()=>{
  assert.match(landing,/utm_campaign=7-bedrijfslekken-202610/g);
  assert.match(landing,/<script src="\/assets\/meting\.js" defer><\/script>/);
  assert.match(readFileSync(new URL('../assets/meting.js',import.meta.url),'utf8'),/gebeurtenis:'klik'/);
  assert.match(skill,/observed, pending, unknown/);
  assert.match(skill,/anti-duplication keys/);
  assert.match(skill,/a published PDF\/post, LinkedIn send or scan/);
});
