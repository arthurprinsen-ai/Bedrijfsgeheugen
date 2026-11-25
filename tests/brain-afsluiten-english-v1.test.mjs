import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../afsluiten.html', import.meta.url), 'utf8');
const prijzen = await readFile(new URL('../prijzen.html', import.meta.url), 'utf8');
const script = html.match(/<script data-bg-page-runtime="saas-checkout">([\s\S]*?)<\/script>/)[1];
const EN = vm.runInNewContext('(()=>{' + script.match(/\/\*EN-START\*\/(const EN=\{[\s\S]*?\});\/\*EN-END\*\//)[1] + ';return EN})()');

function staticTexts() {
  const body = html.match(/<body>([\s\S]*?)<script/)[1];
  return body
    .replace(/<[^>]*>/g, '\n')
    .split('\n')
    .map(text => text.replace(/&amp;/g, '&').trim())
    .filter(Boolean);
}

function stringsInsideT(source) {
  const found = [];
  for (let at = source.indexOf('t('); at !== -1; at = source.indexOf('t(', at + 1)) {
    if (/[A-Za-z0-9_$]/.test(source[at - 1] || '')) continue;
    let depth = 0, end = at + 1;
    for (; end < source.length; end++) { if (source[end] === '(') depth++; if (source[end] === ')' && --depth === 0) break; }
    for (const m of source.slice(at, end).matchAll(/'((?:[^'\\]|\\.)*)'/g)) found.push(m[1].replace(/\\'/g, "'"));
  }
  return found;
}

test('every visible Dutch text on the checkout page has an English translation', () => {
  const skip = new Set(['Website', 'Starter', '€ 99', 'Bedrijfs', 'geheugen', '.nl']);
  const missing = staticTexts().filter(text => !skip.has(text) && !EN[text]);
  assert.deepEqual(missing, []);
});

test('every string the script passes to t() has an English translation', () => {
  const literals = stringsInsideT(script.replace(/\/\*EN-START\*\/[\s\S]*?\/\*EN-END\*\//, ''));
  assert.ok(literals.length > 20);
  // Single lowercase code words ('yearly', 'mode', 'trial') are comparisons and ids, not visible text.
  assert.deepEqual(literals.filter(text => !/^[a-z_]+$/.test(text) && !EN[text]), []);
});

function run({search, store = {}}) {
  const nodes = new Map();
  const element = id => { if (!nodes.has(id)) nodes.set(id, {id, textContent: '', value: '', hidden: false, style: {}, children: [], attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; }, replaceChildren(...c) { this.children = c; }, addEventListener() {}, appendChild() {}, querySelectorAll: () => [], remove() {}}); return nodes.get(id); };
  const doc = {title: 'Bedrijfsgeheugen abonnement afsluiten', documentElement: {attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, set lang(v) { this.attrs.lang = v; }, get lang() { return this.attrs.lang; }}, body: {}, getElementById: element, querySelector: () => element('.top a'), createElement: () => element('a' + Math.random()), createTreeWalker: () => ({nextNode: () => null})};
  const context = {document: doc, NodeFilter: {SHOW_TEXT: 4}, location: {search}, URLSearchParams, sessionStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem() {}}, fetch: () => Promise.resolve({ok: true, json: async () => ({selfServeAvailable: true})}), setTimeout, crypto: {randomUUID: () => 'x'}, encodeURIComponent, console};
  vm.runInNewContext(script, context);
  return {element, doc, store};
}

test('lang=en renders the trial checkout in English and keeps lang on the switch link', () => {
  const {element, doc, store} = run({search: '?plan=pro&billing=yearly&trial=1&lang=en'});
  assert.equal(doc.documentElement.attrs.lang, 'en');
  assert.equal(store.bg_checkout_lang, 'en');
  assert.equal(element('submit').textContent, 'Start 30 days free →');
  assert.equal(element('price').textContent, '€ 2,990');
  assert.equal(element('period').textContent, '/ month after the trial');
  assert.match(element('paymentTerms').textContent, /^I agree to the terms\./);
  assert.match(element('billingNote').textContent, /^Excl\. VAT\. No payment method needed/);
  const link = element('trialSwitch').children[0];
  assert.equal(link.textContent, 'Prefer to pay now?');
  assert.match(link.attrs.href, /lang=en$/);
});

test('paid flow in English says yearly and monthly terms in English', () => {
  const yearly = run({search: '?plan=starter&billing=yearly&lang=en'});
  assert.match(yearly.element('billingNote').textContent, /^Excl\. VAT\. You pay € 990 now and then automatically every year/);
  assert.equal(yearly.element('paymentTerms').textContent, 'I agree to the terms and yearly payment.');
  const monthly = run({search: '?plan=groei&lang=en'});
  assert.equal(monthly.element('period').textContent, '/ month');
  assert.match(monthly.element('trialSwitch').children[0].attrs.href, /trial=1&lang=en$/);
});

test('the language survives the return from Mollie in the same tab', () => {
  const store = {bg_checkout_lang: 'en'};
  const {element} = run({search: '?success=1&trial=1', store});
  assert.equal(element('checkoutResultTitle').textContent, 'Your 30-day trial has started.');
});

test('Dutch stays the default and nothing is translated without lang=en', () => {
  const {element, doc} = run({search: '?plan=pro&trial=1'});
  assert.equal(doc.documentElement.attrs.lang, undefined);
  assert.equal(element('submit').textContent, 'Start 30 dagen gratis →');
  assert.equal(element('price').textContent, '€ 299');
});

test('the English pricing page links to the English checkout', () => {
  assert.match(prijzen, /data-bg-static-locale'\)==='en'/);
  assert.match(prijzen, /'&trial=1'\+L\(\)/);
  assert.match(prijzen, /lang=en/);
});

test('checkout recovers the trial switch if the production HTML normalizer removes its placeholder', () => {
  const start = script.indexOf('function setTrialLink(text,href)');
  const end = script.indexOf("if(q.get('success')", start);
  assert.ok(start >= 0 && end > start, 'checkout switch implementation must exist');
  const fn = script.slice(start, end);
  const appended = [];
  const form = {appendChild(node) { appended.push(node); }};
  const document = {
    getElementById(id) { return id === 'form' ? form : null; },
    createElement(tag) { return {tag, children: [], setAttribute(k,v){this[k]=v;}, replaceChildren(...children){this.children=children;}}; }
  };
  vm.runInNewContext(fn + "setTrialLink('30 dagen gratis', '/afsluiten?trial=1')", {document});
  assert.equal(appended.length, 1);
  assert.equal(appended[0].id, 'trialSwitch');
  assert.equal(appended[0].children[0].textContent, '30 dagen gratis');
  assert.equal(appended[0].children[0].href, '/afsluiten?trial=1');
});
