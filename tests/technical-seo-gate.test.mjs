import assert from 'node:assert/strict';
import test from 'node:test';
import { controleerSeoHtml, verwachtCanonical } from '../tools/controleer-technische-seo.mjs';
import { maakSitemap } from '../tools/genereer-sitemap.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

test('verwachte canonical volgt de publieke route', () => {
  assert.equal(verwachtCanonical('index.html'), `${ORIGIN}/`);
  assert.equal(verwachtCanonical('prijzen.html'), `${ORIGIN}/prijzen`);
  assert.equal(verwachtCanonical('blog/afas-api/index.html'), `${ORIGIN}/blog/afas-api/`);
  assert.equal(verwachtCanonical('blog/afas-koppeling/index.html'), `${ORIGIN}/afas-koppeling`, 'bewuste canonical alias blijft expliciet');
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

test('HTML-achtige tekst in scripts telt niet als echte title H1 of link', () => {
  const html = `<!doctype html><html lang="nl"><head>
    <title>Artikel | Bedrijfsgeheugen</title>
    <meta name="description" content="Een artikel met geldige metadata.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${ORIGIN}/blog/test/">
    <script>const sjabloon = '<title></title><h1>Niet echt</h1><a href="/niet-echt">x</a>';</script>
  </head><body><nav aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a></nav><main><h1>Echte kop</h1></main></body></html>`;
  assert.deepEqual(controleerSeoHtml(html, 'blog/test/index.html'), []);
});

test('bewust gecanonicaliseerde duplicaatpagina mag naar de hoofdlandingspagina wijzen', () => {
  const html = `<!doctype html><html lang="nl"><head>
    <title>AFAS koppeling uitleg | Bedrijfsgeheugen</title>
    <meta name="description" content="Uitleg over een AFAS koppeling.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${ORIGIN}/afas-koppeling">
  </head><body><nav aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a></nav><main><h1>AFAS koppeling</h1></main></body></html>`;
  assert.deepEqual(controleerSeoHtml(html, 'blog/afas-koppeling/index.html'), []);
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

test('sitemap bevat exact canonicals en verzint geen verouderde lastmod-datums', () => {
  const xml = maakSitemap([`${ORIGIN}/prijzen`, `${ORIGIN}/`, `${ORIGIN}/blog/afas-api/`, `${ORIGIN}/prijzen`]);
  assert.match(xml, /<loc>https:\/\/www\.bedrijfsgeheugen\.nl\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.bedrijfsgeheugen\.nl\/prijzen<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/afas-api\/<\/loc>/);
  assert.equal((xml.match(/<loc>/g) || []).length, 3, 'canonicals worden gededupliceerd');
  assert.ok(!/<lastmod>/i.test(xml), 'geen lastmod zonder betrouwbare brondata');
});
