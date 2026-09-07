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

for (const [path, canonical, label] of [
  ['product.html', 'https://www.bedrijfsgeheugen.nl/product', 'Platform'],
  ['prijzen.html', 'https://www.bedrijfsgeheugen.nl/prijzen', 'Prijzen']
]) {
  test(`${path}: canonical shell bewaart de bestaande V18 hero en maakt geen tweede paginakop`, () => {
    const out = applyCanonicalShell(builtV18Page(canonical, label), shell, path);
    assert.ok(out, 'pagina moet projecteerbaar blijven');
    assert.doesNotMatch(out, /class="paginakop"/, 'een reeds gebouwde V18-pagina mag geen tweede generieke hero krijgen');
    assert.equal((out.match(/class="inhoud-kop"/g) || []).length, 1, 'de eigen V18 hero moet exact één keer blijven staan');
    assert.match(out, /class="inhoud-kop"[^>]*data-bg-component="hero"|data-bg-component="hero"[^>]*class="inhoud-kop"/, 'de bestaande V18 hero moet de canonical hero-slot worden');
    assert.equal((out.match(new RegExp(`<h1>${label}<\\/h1>`, 'g')) || []).length, 1, 'de pagina houdt exact één eigen H1');
  });
}

test('prijzen.html: bestaande prijzenhero blijft intact in plaats van te worden vervangen door een generieke paginakop', () => {
  const html = '<!doctype html><html lang="nl"><head><title>Prijzen | Bedrijfsgeheugen</title><meta name="description" content="Prijzen"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/prijzen"></head><body><main><nav class="bgkruim" aria-label="Kruimelpad"><a href="https://www.bedrijfsgeheugen.nl/">Home</a><span aria-current="page">Prijzen</span></nav><section class="held"><div class="wrap"><span class="eyebrow">Prijzen</span><h1>Prijzen voor <span>digitalisering</span> in het mkb</h1><p class="intro">Eigen prijzenintro</p></div></section><section><h2>Pakketten</h2></section></main></body></html>';
  const out = applyCanonicalShell(html, shell, 'prijzen.html');
  assert.ok(out);
  assert.doesNotMatch(out, /class="paginakop"/, 'de pricing builder mag de eigen hero niet vervangen');
  assert.match(out, /class="held"[^>]*data-bg-component="hero"|data-bg-component="hero"[^>]*class="held"/, 'de bestaande prijzenhero moet de canonical hero-slot worden');
  assert.equal((out.match(/<h1>/g) || []).length, 1, 'de eigen prijzen-H1 blijft exact één keer bestaan');
});
