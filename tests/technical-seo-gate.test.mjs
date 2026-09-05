import assert from 'node:assert/strict';
import test from 'node:test';
import { controleerSeoHtml, verwachtCanonical } from '../tools/controleer-technische-seo.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

test('verwachte canonical volgt de publieke route', () => {
  assert.equal(verwachtCanonical('index.html'), `${ORIGIN}/`);
  assert.equal(verwachtCanonical('prijzen.html'), `${ORIGIN}/prijzen`);
  assert.equal(verwachtCanonical('blog/afas-api/index.html'), `${ORIGIN}/blog/afas-api/`);
});

test('geldige publieke pagina voldoet aan metadata, H1 en absolute interne links', () => {
  const html = `<!doctype html><html lang="nl"><head>
    <title>Prijzen digitalisering mkb | Bedrijfsgeheugen</title>
    <meta name="description" content="Bekijk de prijzen voor digitalisering in het mkb.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${ORIGIN}/prijzen">
  </head><body><nav aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a></nav><main><h1>Prijzen digitalisering mkb</h1><a href="${ORIGIN}/product">Product</a></main></body></html>`;
  assert.deepEqual(controleerSeoHtml(html, 'prijzen.html'), []);
});

test('gate weigert dubbele H1, verkeerde canonical en root-relative interne links', () => {
  const html = `<!doctype html><html><head>
    <title>Fout</title><meta name="description" content="Fout">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${ORIGIN}/verkeerd">
  </head><body><h1>Eén</h1><h1>Twee</h1><a href="/product">Product</a></body></html>`;
  const fouten = controleerSeoHtml(html, 'prijzen.html').join('\n');
  assert.match(fouten, /exact één H1/i);
  assert.match(fouten, /canonical/i);
  assert.match(fouten, /absolute interne href/i);
});
