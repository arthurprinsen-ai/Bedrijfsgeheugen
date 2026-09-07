import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCanonicalShell } from '../tools/site-shell/apply-shell.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

function tel(html, re) {
  return [...String(html).matchAll(re)].length;
}

test('prijzen behoudt één complete native canonical hero inclusief propositie CTA en geïntegreerde breadcrumb', () => {
  const shell = {
    voor: '<!doctype html><html lang="nl"><head><title>Shell</title><meta name="description" content="Shell"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/over-ons"></head><body><header class="v17-header"><a href="https://www.bedrijfsgeheugen.nl/">Bedrijfsgeheugen</a></header><aside class="v18-mobile-drawer"><a href="https://www.bedrijfsgeheugen.nl/prijzen">Prijzen</a></aside>',
    na: '<footer data-bg-component="footer"><a href="mailto:arthur@bedrijfsgeheugen.nl">Mail</a></footer></body></html>'
  };
  const prijzen = `<!doctype html><html lang="nl"><head>
    <title>Prijzen digitalisering mkb | Bedrijfsgeheugen</title>
    <meta name="description" content="Prijzen voor digitalisering in het mkb">
    <link rel="canonical" href="${ORIGIN}/prijzen">
    <style>.bgkruim{background:#fff}.held{background:#0e2148}.pil{display:inline-flex}</style>
  </head><body><main>
    <div class="held">
      <div class="wrap">
        <span class="eyebrow">Prijzen</span>
        <div class="pil">AI-gedreven. Menselijk gecontroleerd.</div>
        <h1>Prijzen voor <span>digitalisering</span> in het mkb</h1>
        <p class="lead">De AI doet het werk. Wij controleren het.</p>
        <p class="payoff">Aanpakken zonder aanmodderen.</p>
        <div class="heldknoppen"><a class="hk geel" href="#pakketten">Bekijk pakketten</a><a class="hk wit" href="/frisse-blik">Doe de Frisse Blik</a></div>
      </div>
    </div>
    <nav class="bgkruim" aria-label="Kruimelpad"><a href="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">Prijzen</span></nav>
    <section id="pakketten" class="prijzen-inhoud"><h2>Vier pakketten</h2></section>
  </main></body></html>`;

  const uit = applyCanonicalShell(prijzen, shell, 'prijzen.html');
  assert.ok(uit, 'pricing page moet projecteerbaar zijn');
  assert.equal(tel(uit, /<h1\b/gi), 1, 'er mag exact één H1 zijn');
  assert.equal(tel(uit, /data-bg-component="hero"/gi), 1, 'er mag exact één hero-component zijn');
  assert.match(uit, /<div\b[^>]*class="[^"]*\bheld\b[^"]*"[^>]*data-bg-component="hero"|<div\b[^>]*data-bg-component="hero"[^>]*class="[^"]*\bheld\b/, 'de echte div.held prijshero moet zelf het canonical hero-component zijn');
  assert.equal(tel(uit, /<div\b[^>]*class="[^"]*\bheld\b/gi), 1, 'de native prijshero mag exact één keer voorkomen');
  assert.equal(tel(uit, /<nav\b[^>]*class="[^"]*\bbgkruim\b/gi), 1, 'SEO houdt exact één zichtbaar kruimelpad');
  assert.match(uit, /<div\b[^>]*class="[^"]*\bheld\b[^"]*"[^>]*data-bg-component="hero"[\s\S]*?<nav\b[^>]*class="[^"]*\bbgkruim\b[\s\S]*?<h1\b/i, 'het kruimelpad moet binnen dezelfde donkere hero staan, vóór de H1');
  assert.match(uit, /\.held\s+\.bgkruim\s*\{[^}]*background\s*:\s*transparent\s*!important/i, 'de canonical shell moet een legacy witte breadcrumb-achtergrond hard overschrijven');
  assert.ok(uit.includes('AI-gedreven. Menselijk gecontroleerd.'), 'de prijspropositie moet zichtbaar blijven');
  assert.ok(uit.includes('De AI doet het werk. Wij controleren het.'), 'de hero-intro moet zichtbaar blijven');
  assert.ok(uit.includes('Aanpakken zonder aanmodderen.'), 'de payoff moet zichtbaar blijven');
  assert.ok(uit.includes('Bekijk pakketten'), 'de primaire hero-CTA moet zichtbaar blijven');
  assert.ok(uit.includes('Doe de Frisse Blik'), 'de secundaire hero-CTA moet zichtbaar blijven');
  assert.ok(!uit.includes('class="paginakop"'), 'prijzen mag niet worden teruggebracht tot de generieke paginakop');
  assert.ok(uit.includes('<h2>Vier pakketten</h2>'), 'prijsinhoud moet behouden blijven');
});

test('door de shell gegenereerde interne links blijven absoluut en breadcrumb blijft geïntegreerd in de prijshero', () => {
  const shell = {
    voor: '<!doctype html><html lang="nl"><head><title>Shell</title><meta name="description" content="Shell"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/over-ons"></head><body><header class="v17-header"></header><aside class="v18-mobile-drawer"></aside>',
    na: '<footer data-bg-component="footer"></footer></body></html>'
  };
  const pagina = `<!doctype html><html lang="nl"><head><title>Test</title><meta name="description" content="Test"><link rel="canonical" href="${ORIGIN}/prijzen"></head><body><main><div class="held"><div class="wrap"><h1>Prijzen</h1><button type="button" data-view="product">Product</button></div></div></main></body></html>`;
  const uit = applyCanonicalShell(pagina, shell, 'prijzen.html');

  assert.ok(uit.includes(`href="${ORIGIN}/product"`), 'data-view product moet absolute URL worden');
  assert.equal(tel(uit, /<nav\b[^>]*class="[^"]*\bbgkruim\b/gi), 1, 'technische SEO vereist exact één zichtbaar kruimelpad');
  assert.match(uit, /<div\b[^>]*class="[^"]*\bheld\b[^"]*"[^>]*data-bg-component="hero"[\s\S]*?<nav\b[^>]*class="[^"]*\bbgkruim\b[\s\S]*?<h1\b/i, 'breadcrumb mag nooit als losse balk buiten de hero staan');
  assert.ok(uit.includes('BreadcrumbList'), 'de breadcrumb blijft ook machineleesbaar aanwezig');
  assert.ok(!/href="\/(?!\/)/.test(uit), 'gegenereerde interne hrefs mogen niet root-relative zijn');
});
