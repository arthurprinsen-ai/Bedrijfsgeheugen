import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scan=readFileSync(new URL('../zelfscan.html',import.meta.url),'utf8');
const page=readFileSync(new URL('../pages/7-bedrijfslekken.html',import.meta.url),'utf8');
const i18n=JSON.parse(readFileSync(new URL('../config/bg-static-i18n-en.d/2026-10-09-seven-leaks-internal-activation.json',import.meta.url),'utf8'));
const workbook='/7-bedrijfslekken?utm_source=';
const text='Download gratis het werkboek: 7 verborgen bedrijfslekken →';

test('replay: existing homepage and ungated selfscan each offer one real worksheet entry link',()=>{
  assert.match(home,/href="\/7-bedrijfslekken\?utm_source=homepage&utm_medium=website&utm_campaign=7-bedrijfslekken-202610"/);
  assert.match(scan,/href="\/7-bedrijfslekken\?utm_source=zelfscan&utm_medium=website&utm_campaign=7-bedrijfslekken-202610"/);
  assert.equal(home.split(workbook).length-1,1);
  assert.equal(scan.split(workbook).length-1,1);
  assert.ok(home.includes(text)&&scan.includes(text));
});

test('shadow: scan primary free result and product navigation remain unchanged',()=>{
  assert.match(scan,/<button class="knopvol" onclick="ga\(1\)">Laat zien waar mijn bedrijf lekt/);
  assert.match(home,/data-money-primary href="https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/);
  assert.match(home,/data-money-secondary href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\//);
  assert.match(page,/href="\/assets\/downloads\/7-verborgen-bedrijfslekken\.pdf"/);
  assert.doesNotMatch(page,/<form\b/);
});

test('canary: source-level English parity patch is complete and truthful',()=>{
  assert.equal(i18n[text],'Download the free workbook: 7 hidden business leaks →');
  assert.equal(Object.keys(i18n).length,1);
  assert.match(page,/Zonder account, e-mailadres of verkooppraatje/);
});

test('outcome guard: non-purchase worksheet links cannot establish realized revenue',()=>{
  const source=readFileSync(new URL('../skills/powerhouse-product-led-growth.md',import.meta.url),'utf8');
  assert.match(source,/paid orders and recurring revenue/);
  assert.match(source,/PDF download/);
  assert.match(source,/P0 #4198/);
});
