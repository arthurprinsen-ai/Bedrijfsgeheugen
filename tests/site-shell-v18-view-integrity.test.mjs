import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCanonicalShell } from '../tools/site-shell/apply-shell.mjs';

const shell = {
  voor: '<!doctype html><html lang="nl"><head><title>Shell</title><meta name="description" content="shell"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/over-ons"></head><body><header class="v17-header" data-bg-component="header">Header</header>',
  na: '<footer data-bg-component="footer">Footer</footer></body></html>'
};

function builtV18Page(canonical, label) {
  return `<!doctype html><html lang="nl"><head><title>${label} | Bedrijfsgeheugen</title><meta name="description" content="${label}"><link rel="canonical" href="${canonical}"></head><body><main><nav class="bgkruim" aria-label="Kruimelpad"><a href="https://www.bedrijfsgeheugen.nl/">Home</a><span aria-current="page">${label}</span></nav><section class="inhoud-kop"><div class="wrap"><div class="hero-kicker">${label.toUpperCase()}</div><h1>${label}</h1><p class="intro">Eigen V18 pagina-intro</p></div></section><section class="inhoud-body"><h2>Eigen inhoud</h2><p>Deze inhoud hoort bij de pagina.</p></section></main></body></html>`;
}

test('product.html: canonical shell bewaart de bestaande V18 hero en maakt geen tweede paginakop', () => {
  const out = applyCanonicalShell(builtV18Page('https://www.bedrijfsgeheugen.nl/product', 'Platform'), shell, 'product.html');
  assert.ok(out, 'pagina moet projecteerbaar blijven');
  assert.doesNotMatch(out, /class="paginakop"/, 'een reeds gebouwde V18-pagina mag geen tweede generieke hero krijgen');
  assert.equal((out.match(/class="inhoud-kop"/g) || []).length, 1, 'de eigen V18 hero moet exact één keer blijven staan');
  assert.match(out, /class="inhoud-kop"[^>]*data-bg-component="hero"|data-bg-component="hero"[^>]*class="inhoud-kop"/, 'de bestaande V18 hero moet de canonical hero-slot worden');
  assert.equal((out.match(/<h1>Platform<\/h1>/g) || []).length, 1, 'de pagina houdt exact één eigen H1');
});

test('prijzen.html: echte div-held prijshero blijft intact en breadcrumb kan nooit als witte losse balk renderen', () => {
  const html = '<!doctype html><html lang="nl"><head><title>Prijzen | Bedrijfsgeheugen</title><meta name="description" content="Prijzen"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/prijzen"><style>.bgkruim{background:#fff}.held{background:#0e2148}</style></head><body><main><div class="held"><div class="wrap"><span class="pil">AI-gedreven. Menselijk gecontroleerd.</span><h1>Prijzen voor <span>digitalisering</span> in het mkb</h1><p class="ondertitel">De AI doet het werk. Wij controleren het.</p><p class="payoff">Aanpakken zonder aanmodderen.</p><div class="heldknoppen"><a class="hk geel" href="#pakketten">Bekijk pakketten</a><a class="hk wit" href="/frisse-blik">Doe de Frisse Blik</a></div></div></div><nav class="bgkruim" aria-label="Kruimelpad"><div class="wrap"><a href="/">Home</a> › <a href="/product">Het portaal</a> › <span aria-current="page">Prijzen</span></div></nav><section id="pakketten"><h2>Pakketten</h2></section></main></body></html>';
  const out = applyCanonicalShell(html, shell, 'prijzen.html');
  assert.ok(out);
  assert.doesNotMatch(out, /class="paginakop"/, 'prijzen mag nooit naar een generieke tweede hero worden omgezet');
  assert.match(out, /<div\b[^>]*class="[^"]*\bheld\b[^"]*"[^>]*data-bg-component="hero"|<div\b[^>]*data-bg-component="hero"[^>]*class="[^"]*\bheld\b/, 'de echte div.held prijshero moet zelf de canonical hero-slot zijn');
  assert.equal((out.match(/class="held"/g) || []).length, 1, 'de prijshero blijft exact één keer staan');
  assert.equal((out.match(/<nav\b[^>]*class="[^"]*\bbgkruim\b/gi) || []).length, 1, 'SEO houdt exact één zichtbaar kruimelpad');
  assert.match(out, /<div\b[^>]*class="[^"]*\bheld\b[^"]*"[^>]*data-bg-component="hero"[\s\S]*?<nav\b[^>]*class="[^"]*\bbgkruim\b[\s\S]*?<h1\b/i, 'het kruimelpad moet binnen dezelfde donkere hero staan, vóór de H1');
  assert.match(out, /\.held\s+\.bgkruim\s*\{[^}]*background\s*:\s*transparent\s*!important/i, 'de canonical shell moet de oude witte breadcrumb-achtergrond hard overschrijven');
  assert.match(out, /BreadcrumbList/, 'machineleesbare breadcrumb blijft voor SEO bestaan');
  assert.match(out, /AI-gedreven\. Menselijk gecontroleerd\./, 'de prijspropositie blijft zichtbaar');
  assert.match(out, /De AI doet het werk\. Wij controleren het\./, 'de hero-intro blijft zichtbaar');
  assert.match(out, /Aanpakken zonder aanmodderen\./, 'de payoff blijft zichtbaar');
  assert.match(out, /Bekijk pakketten/, 'de primaire hero-CTA blijft zichtbaar');
  assert.equal((out.match(/<h1\b/g) || []).length, 1, 'prijzen houdt exact één H1');
  assert.match(out, /<h2>Pakketten<\/h2>/, 'eigen prijsinhoud blijft behouden');
});
