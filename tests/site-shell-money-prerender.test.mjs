import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prerenderMoney, padVan, PRERENDER_MARKER } from '../tools/site-shell/money-prerender.mjs';

// Money-page blokken bij de build (11 sept 2026): op /ai-scan zette stijl.js een
// blok van 432 px midden in de hero, ±0,4 s na laden (CLS 0,10–0,13).
const stijl = readFileSync('assets/stijl.js', 'utf8');
const pagina = (hero) => `<!doctype html><html><head><title>x</title><script src="/assets/stijl.js" defer></script></head><body><main>${hero}<section class="inhoud-body"><p>Tekst</p></section></main></body></html>`;
const inhoudKop = '<section class="inhoud-kop" data-bg-component="hero"><div class="wrap"><h1>AI-scan</h1><p class="intro">Intro</p></div></section>';

test('een money-pagina krijgt hero-blok, besliskader en opmaak al in de HTML, op de plek van stijl.js', () => {
  const uit = prerenderMoney(pagina(inhoudKop), '/ai-scan', stijl);
  assert.match(uit, /<p class="intro">Intro<\/p><section class="bg-money-hero"[^>]*data-bg-money-prerender/);
  assert.match(uit, /<section class="bg-money-decision"[^>]*data-bg-money-prerender[\s\S]*<\/section><\/main>/);
  assert.match(uit, /<style id="bgMoneyStyle" data-bg-money-prerender>/);
  assert.match(uit, /class="bg-money-btn" href="https:\/\/www\.bedrijfsgeheugen\.nl\/[^"]*" data-bg-cta="primary"/);
  assert.equal(prerenderMoney(uit, '/ai-scan', stijl), uit, 'idempotent');
});

test('een bestaande V18-hero krijgt geen tweede blok (zoals in de browser)', () => {
  const uit = prerenderMoney(pagina('<div class="held" data-bg-component="hero"><h1>Prijzen</h1><p>x</p></div>'), '/prijzen', stijl);
  assert.doesNotMatch(uit, /class="bg-money-hero"/);
  assert.match(uit, /bg-money-decision/);
});

test('niets op pagina\'s zonder stijl.js of buiten de money-pagina\'s', () => {
  const zonder = pagina(inhoudKop).replace('<script src="/assets/stijl.js" defer></script>', '');
  assert.equal(prerenderMoney(zonder, '/ai-scan', stijl), zonder);
  assert.equal(prerenderMoney(pagina(inhoudKop), '/over-ons', stijl), pagina(inhoudKop));
  assert.equal(padVan('ai-scan.html'), '/ai-scan');
  assert.equal(padVan('index.html'), '/');
  assert.equal(padVan('blog/x/index.html'), '/blog/x');
});

test('stijl.js voegt niets dubbel toe en koppelt de klikmeting aan vooraf geplaatste knoppen', () => {
  assert.match(stijl, /if\(document\.querySelector\('\.bg-money-hero'\)\)return;/);
  assert.match(stijl, /if\(document\.querySelector\('\.bg-money-decision'\)\)return;/);
  assert.match(stijl, /if\(document\.getElementById\('bgMoneyStyle'\)\)return;/);
  assert.match(stijl, /querySelectorAll\('\[data-bg-money-prerender\] \.bg-money-btn'\)/);
  assert.ok(PRERENDER_MARKER === 'data-bg-money-prerender');
});
