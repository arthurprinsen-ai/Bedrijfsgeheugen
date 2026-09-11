import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { applyCanonicalShell } from '../tools/site-shell/apply-shell.mjs';

// Basic Consent Mode (11 sept 2026). Live stond de GA4-loader op elke pagina zonder
// gtag('config'): 175 KB en ±0,5 s blokkade voor iedereen en geen enkele meting.
// Nu: de schil zet de loader om in <meta name="bg-ga4">; assets/stijl.js laadt gtag.js
// en doet de config pas na toestemming. Zonder toestemming laadt er niets van Google.

const ID = 'G-912L0PB68G';
const shell = {
  voor: '<!doctype html><html lang="nl"><head><title>Shell</title><meta name="description" content="shell"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/over-ons"></head><body><header class="v17-header" data-bg-component="header">Header</header>',
  na: '<footer data-bg-component="footer">Footer</footer></body></html>'
};
const canon = 'https://www.bedrijfsgeheugen.nl/blog/test/';
const pagina = `<!doctype html><html lang="nl"><head><title>Test</title><meta name="description" content="x"><link rel="canonical" href="${canon}"><script async src="https://www.googletagmanager.com/gtag/js?id=${ID}"></script><script src="/assets/stijl.js" defer></script></head><body><main><h1>Test</h1><p class="lead">Intro</p><section><h2>Kop</h2><p>Tekst</p></section></main></body></html>`;

test('de schil zet de analytics-loader om in een meet-ID: geen Google-script in de pagina', () => {
  const out = applyCanonicalShell(pagina, shell, 'blog/test/index.html');
  assert.ok(out);
  assert.doesNotMatch(out, /<script[^>]+googletagmanager\.com\/gtag\/js/, 'gtag.js mag niet vooraf laden');
  assert.match(out, new RegExp(`<meta name="bg-ga4" content="${ID}">`));
  assert.match(out, /<script src="\/assets\/stijl\.js" defer><\/script>/, 'de toestemmingslaag blijft staan');
});

// Voer alleen het toestemmingsdeel van stijl.js uit in een nagebootste browser.
const bron = readFileSync('assets/stijl.js', 'utf8');
const toestemming = bron.slice(0, bron.indexOf('})();') + 5);
function browser(opgeslagen) {
  const handlers = {}; const knoppen = {}; const toegevoegd = [];
  const el = id => (knoppen[id] ||= { id, classList: { add() {}, remove() {} }, addEventListener(t, f) { this['on' + t] = f; } });
  const document = {
    getElementById: el,
    addEventListener: (t, f) => { handlers[t] = f; },
    querySelector: q => q === 'meta[name="bg-ga4"]' ? { getAttribute: () => ID } : null,
    createElement: () => ({}),
    head: { appendChild: s => toegevoegd.push(s) }
  };
  const opslag = new Map(opgeslagen ? [['bg_consent', opgeslagen]] : []);
  const window = { dataLayer: [] };
  window.gtag = function () { window.dataLayer.push(arguments); };
  const ctx = vm.createContext({ window, document, gtag: window.gtag, localStorage: { getItem: k => opslag.get(k) ?? null, setItem: (k, v) => opslag.set(k, v) }, Date });
  vm.runInContext(toestemming, ctx);
  handlers.DOMContentLoaded();
  const config = () => [...window.dataLayer].some(a => a[0] === 'config' && a[1] === ID);
  return { toegevoegd, knoppen, config };
}

test('zonder keuze laadt er niets van Google', () => {
  const b = browser(null);
  assert.equal(b.toegevoegd.length, 0);
  assert.equal(b.config(), false);
});

test('na weigeren laadt er niets van Google', () => {
  const b = browser('denied');
  assert.equal(b.toegevoegd.length, 0);
  assert.equal(b.config(), false);
});

test('na accepteren laadt gtag.js één keer, met config', () => {
  const b = browser(null);
  b.knoppen.bgCookieAccept.onclick();
  b.knoppen.bgCookieAccept.onclick();
  assert.equal(b.toegevoegd.length, 1, 'precies één keer geladen');
  assert.match(b.toegevoegd[0].src, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${ID}`));
  assert.equal(b.config(), true, 'config wordt verstuurd');
});

test('een eerdere toestemming laadt direct bij het volgende bezoek', () => {
  const b = browser('granted');
  assert.equal(b.toegevoegd.length, 1);
  assert.equal(b.config(), true);
});
