import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCanonicalShell } from '../tools/site-shell/apply-shell.mjs';

// Aanleiding (10 sept 2026): vrijwel elke pagina droeg het WebPage-schema van /over-ons
// en tot elf dubbele JSON-LD-blokken, omdat de schil uit over-ons.html zijn eigen
// gegevensblokken meenam en de pagina haar blokken daar zonder ontdubbeling bij kreeg.
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
const ORG = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Bedrijfsgeheugen', url: 'https://www.bedrijfsgeheugen.nl/' };
const OVER_ONS = { '@context': 'https://schema.org', '@type': 'WebPage', headline: 'Over ons', url: 'https://www.bedrijfsgeheugen.nl/over-ons', mainEntityOfPage: 'https://www.bedrijfsgeheugen.nl/over-ons' };
const shell = {
  voor: `<!doctype html><html lang="nl"><head><title>Shell</title><meta name="description" content="shell"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/over-ons">${ld(ORG)}${ld(OVER_ONS)}</head><body><header class="v17-header" data-bg-component="header">Header</header>`,
  na: '<footer data-bg-component="footer">Footer</footer></body></html>'
};
const canon = 'https://www.bedrijfsgeheugen.nl/blog/werkinstructie-voorbeeld/';
const BLOG = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Werkinstructie voorbeeld', url: canon, mainEntityOfPage: canon };
const pagina = (extra = '') => `<!doctype html><html lang="nl"><head><title>Werkinstructie voorbeeld</title><meta name="description" content="x"><link rel="canonical" href="${canon}">${ld(BLOG)}${ld(ORG)}${extra}</head><body><main><h1>Werkinstructie voorbeeld</h1><p class="lead">Intro</p><section><h2>Inhoud</h2><p>Tekst</p></section></main></body></html>`;
const blokken = html => (html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi) || []).map(b => JSON.parse(b.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')));

test('de schil brengt geen eigen gegevensblokken (zoals Over ons) mee naar andere pagina\'s', () => {
  const out = applyCanonicalShell(pagina(), shell, 'blog/werkinstructie-voorbeeld/index.html');
  assert.ok(out);
  assert.equal(blokken(out).filter(b => b.headline === 'Over ons').length, 0, 'geen Over ons-schema op een blogpagina');
});

test('identieke gegevensblokken staan er precies één keer in', () => {
  const out = applyCanonicalShell(pagina(ld(ORG) + ld(BLOG)), shell, 'blog/werkinstructie-voorbeeld/index.html');
  const b = blokken(out);
  assert.equal(b.filter(x => x['@type'] === 'Organization').length, 1);
  assert.equal(b.filter(x => x['@type'] === 'BlogPosting').length, 1);
});

test('een WebPage-schema van een andere URL dat al in de pagina lekte, wordt geweigerd', () => {
  const out = applyCanonicalShell(pagina(ld(OVER_ONS)), shell, 'blog/werkinstructie-voorbeeld/index.html');
  assert.equal(blokken(out).filter(x => x.headline === 'Over ons').length, 0);
  assert.equal(blokken(out).filter(x => x['@type'] === 'BlogPosting').length, 1, 'het eigen BlogPosting-schema blijft staan');
});
