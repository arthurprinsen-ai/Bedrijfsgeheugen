import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { metAnalytics, maakToestemmingsScript, knopSelectoren, GA4_ID, TOESTEMMING_SRC, KLIK_EVENT } from '../tools/site-shell/analytics-sitebreed.mjs';
import { publiekePaginas } from '../tools/site-shell/cta-conversie.mjs';

// GA4 op elke publieke pagina, pas na toestemming (11 sept 2026). Tot dan maten
// alleen pagina's met een GA4-tag in de bron; de homepage mat niets.
const stijl = readFileSync('assets/stijl.js', 'utf8');
const css = readFileSync('assets/cta-conversie.css', 'utf8');
const kaal = '<!doctype html><html><head><title>x</title></head><body><main><a class="cta" href="/zelfscan">Doe de scan</a></main></body></html>';

test('een pagina zonder analytics krijgt consent-default, meet-ID, toestemmingsscript en banner', () => {
  const uit = metAnalytics(kaal);
  const kop = uit.slice(0, uit.indexOf('</head>'));
  assert.ok(kop.indexOf("gtag('consent','default'") > -1, 'consent default ontbreekt');
  assert.ok(kop.indexOf("gtag('consent','default'") < kop.indexOf('/assets/toestemming.js'), 'consent default moet vóór het script staan');
  assert.match(kop, new RegExp(`<meta name="bg-ga4" content="${GA4_ID}">`));
  assert.ok(kop.includes(`src="${TOESTEMMING_SRC}" defer`));
  assert.match(uit, /id="bgCookie"/);
  assert.doesNotMatch(uit, /<script[^>]+googletagmanager\.com\/gtag\/js/, 'gtag.js mag nooit vooraf laden');
});

test('idempotent en niets dubbel op een pagina die de schil al van analytics voorzag', () => {
  const eenmaal = metAnalytics(kaal);
  assert.equal(metAnalytics(eenmaal), eenmaal);
  const schil = kaal.replace('</head>', `<script>gtag('consent','default',{})</script><meta name="bg-ga4" content="${GA4_ID}"><script src="/assets/stijl.js" defer></script></head>`)
    .replace('</body>', '<div id="bgCookie"></div></body>');
  const uit = metAnalytics(schil);
  assert.equal(uit.match(/consent','default'/g).length, 1);
  assert.equal(uit.match(/name="bg-ga4"/g).length, 1);
  assert.equal(uit.match(/id="bgCookie"/g).length, 1);
});

test('het klantportaal valt buiten de sitebrede meting', async () => {
  const paginas = await publiekePaginas();
  for (const p of ['klantportaal.html', 'klantportaal-demo.html', 'klant-login.html']) assert.ok(!paginas.includes(p), p);
});

test('de knopmeting gebruikt exact de selectoren van de oranje knop', () => {
  const sel = knopSelectoren(css);
  assert.ok(sel.startsWith('.cta,') && sel.includes('.v18-btn-primary') && !sel.includes('ask-chip'));
  assert.ok(maakToestemmingsScript(stijl, css).includes(JSON.stringify(sel)));
});

function browser({ opgeslagen = null, stijlAanwezig = false } = {}) {
  const handlers = {}; const knoppen = {}; const geladen = []; const events = [];
  const opslag = { bg_consent: opgeslagen };
  const el = id => (knoppen[id] ||= { id, classList: { add() {}, remove() {} }, addEventListener(t, f) { this['on' + t] = f; } });
  const document = {
    getElementById: el,
    addEventListener: (t, f) => { (handlers[t] ||= []).push(f); },
    querySelector: q => q === 'meta[name="bg-ga4"]' ? { getAttribute: () => GA4_ID } : (q.includes('stijl.js') ? (stijlAanwezig ? {} : null) : null),
    createElement: () => ({}),
    head: { appendChild: s => geladen.push(s.src) }
  };
  const window = { dataLayer: [] };
  window.gtag = function () { window.dataLayer.push([...arguments]); if (arguments[0] === 'event') events.push(arguments); };
  const ctx = { window, document, localStorage: { getItem: k => opslag[k] ?? null, setItem: (k, v) => { opslag[k] = v; } }, location: { pathname: '/' } };
  ctx.gtag = (...a) => window.gtag(...a);
  vm.runInNewContext(maakToestemmingsScript(stijl, css), ctx);
  (handlers.DOMContentLoaded || []).forEach(f => f());
  const klik = tekst => (handlers.click || []).forEach(f => f({ target: { closest: () => ({ textContent: tekst, getAttribute: () => '/zelfscan' }) } }));
  return { knoppen, geladen, events, klik, opslag };
}

test('zonder toestemming laadt er niets van Google en wordt een klik niet gemeten', () => {
  const b = browser();
  b.klik('Doe de scan');
  assert.equal(b.geladen.length, 0);
  assert.equal(b.events.length, 0);
});

test('na accepteren laadt gtag.js één keer en wordt de klik op de primaire knop gemeten', () => {
  const b = browser();
  b.knoppen.bgCookieAccept.onclick();
  assert.equal(b.opslag.bg_consent, 'granted');
  assert.equal(b.geladen.length, 1);
  assert.match(b.geladen[0], new RegExp(`googletagmanager\\.com/gtag/js\\?id=${GA4_ID}`));
  b.klik('  Doe   de scan ');
  assert.equal(b.events.length, 1);
  assert.equal(b.events[0][1], KLIK_EVENT);
  assert.equal(b.events[0][2].knop_tekst, 'Doe de scan');
});

test('met stijl.js op de pagina doet het toestemmingsdeel niets (geen dubbele gtag.js)', () => {
  const b = browser({ opgeslagen: 'granted', stijlAanwezig: true });
  assert.equal(b.geladen.length, 0);
});
