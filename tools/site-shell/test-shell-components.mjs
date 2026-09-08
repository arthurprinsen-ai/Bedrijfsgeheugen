import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLOBAL_COMPONENTS, componentHash, verifyPageShell, markCanonicalComponents } from './contracts.mjs';
import { extractComponent, replaceComponent } from './components.mjs';
import { CANONICAL_SHELL_SOURCE, extractPageMain, projectGlobalComponents } from './apply-shell.mjs';
import { normaliseerHtml } from '../normaliseer-site-ui.mjs';

const canonical = `<!doctype html><html><head></head><body>
<div data-bg-component="trustbar">trust</div>
<header class="v17-header" data-bg-component="header"><nav>nav</nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-menu">menu</aside>
<section data-bg-component="hero">hero</section>
<main data-bg-component="main">body</main>
<footer data-bg-component="footer">footer</footer>
</body></html>`;

assert.deepEqual(GLOBAL_COMPONENTS, ['trustbar','header','mobile-menu','footer']);
assert.equal(componentHash(canonical, 'header'), componentHash(canonical, 'header'));
assert.doesNotThrow(() => verifyPageShell(canonical, 'voorbeeld.html'));
assert.equal(CANONICAL_SHELL_SOURCE, 'over-ons.html');

const target = canonical
  .replace('>trust<','>oud trust<')
  .replace('<nav>nav</nav>','<nav>oud</nav>')
  .replace('>menu<','>oud menu<')
  .replace('>footer<','>oude footer<')
  .replace('>body<','>homepage body<');
const projected = projectGlobalComponents(target, canonical);
for (const name of GLOBAL_COMPONENTS) assert.equal(componentHash(projected, name), componentHash(canonical, name), `${name} moet exact canonical worden`);
assert.equal(extractComponent(projected, 'main'), extractComponent(target, 'main'), 'globale componentprojectie mag homepage main niet wijzigen');

const ruweV18 = `<!doctype html><body><header class="v17-header">header</header><aside class="v18-mobile-drawer" id="v18MobileDrawer">drawer</aside><footer>footer</footer></body>`;
const gemarkeerd = markCanonicalComponents(ruweV18);
assert.ok(gemarkeerd.includes('class="v18-mobile-drawer" id="v18MobileDrawer" data-bg-component="mobile-menu"'));

const afwijkend = canonical.replace('class="v17-header"', 'class="bgkop"');
assert.throws(() => verifyPageShell(afwijkend, 'prijzen.html'), /legacy|header|canonical/i);
const dubbeleFooter = canonical.replace('</body>', '<footer data-bg-component="footer">dubbel</footer></body>');
assert.throws(() => verifyPageShell(dubbeleFooter, 'dubbel.html'), /footer/i);

const pricingOk = canonical.replace('<main data-bg-component="main">body</main>', '<main data-bg-component="main">body<section data-bg-component="page-tools"><div class="bgx-vraagbalk"></div><div class="bgx-rekenaar"></div><div class="bgx-rol"></div></section></main>');
assert.doesNotThrow(() => verifyPageShell(pricingOk, 'prijzen.html'));
assert.throws(() => verifyPageShell(pricingOk, 'over-ons.html'), /pricing|page-tools/i);

const legacyPricing = '<!doctype html><html><body><nav class="bgkop">oud menu</nav><div class="held"><h1>Prijzen</h1></div><section id="pakketten">inhoud</section><footer class="bgvoet">oude voet</footer></body></html>';
assert.equal(extractPageMain(legacyPricing, 'prijzen.html'), '<div class="held"><h1>Prijzen</h1></div><section id="pakketten">inhoud</section>');
assert.equal(extractPageMain('<body><main><p>normaal</p></main></body>', 'normaal.html'), '<p>normaal</p>');

const alleenPricingCss = canonical.replace('</head>', '<style>.bgx-vraagbalk{display:grid}.bgx-rekenaar{display:block}.bgx-rol{display:flex}</style></head>');
assert.doesNotThrow(() => verifyPageShell(alleenPricingCss, '404.html'));
const pricingNaNormalisatie = normaliseerHtml(alleenPricingCss, 'prijzen.html');
assert.ok(/<[^>]+class="[^"]*\bbgx-vraagbalk\b/i.test(pricingNaNormalisatie));
assert.ok(pricingNaNormalisatie.includes('data-bg-component="page-tools"'));

const oudeMain = extractComponent(canonical, 'main');
const oudeFooter = extractComponent(canonical, 'footer');
const nieuweHeader = '<header class="v17-header" data-bg-component="header"><nav>nieuw menu</nav></header>';
const alleenHeader = replaceComponent(canonical, 'header', nieuweHeader);
assert.equal(extractComponent(alleenHeader, 'main'), oudeMain);
assert.equal(extractComponent(alleenHeader, 'footer'), oudeFooter);
assert.equal(extractComponent(alleenHeader, 'header'), nieuweHeader);

const canonicalHeader = await readFile('.github/canoniek/kop.html', 'utf8');
const kennisHref = 'href="https://www.bedrijfsgeheugen.nl/kennis/"';
const blogHref = 'href="https://www.bedrijfsgeheugen.nl/blog/"';
const kennisPositie = canonicalHeader.indexOf(kennisHref);
const blogPositie = canonicalHeader.indexOf(blogHref);
assert.ok(kennisPositie >= 0, 'canonical Kennis-menu moet naar de zelfstandige /kennis/ hub linken');
assert.ok(blogPositie >= 0, 'canonical Kennis-menu moet Blog als aparte /blog/ bestemming behouden');
assert.ok(kennisPositie < blogPositie, 'Kennisbank moet vóór Blog staan in het canonical Kennis-menu');
assert.ok(canonicalHeader.includes(`${kennisHref}><b>Kennisbank</b>`), 'desktop Kennis-menu moet Kennisbank expliciet benoemen');
assert.ok(canonicalHeader.includes(`${kennisHref}>Kennisbank</a>`), 'mobiel Kennis-menu moet Kennisbank expliciet benoemen');
const canonicalHrefs = [...canonicalHeader.matchAll(/\bhref="([^"]+)"/g)].map(([, href]) => href);
assert.ok(canonicalHrefs.length > 0, 'canonical header moet navigatielinks bevatten');
assert.ok(canonicalHrefs.every((href) => /^https:\/\/www\.bedrijfsgeheugen\.nl\//.test(href)), 'alle hrefs in de canonical header moeten absolute bedrijfsgeheugen.nl URLs zijn');

const productionBuilder = await readFile('tools/bouw-v18-production.mjs', 'utf8');
assert.ok(!productionBuilder.includes("await import('./uniforme-schil.mjs')"));
const normalizer = await readFile('tools/normaliseer-site-ui.mjs', 'utf8');
assert.ok(normalizer.includes('await applyCanonicalShellToAllPages()'));
assert.ok(!normalizer.includes('PRICING_MOBILE_MENU_HTML'));
assert.ok(!normalizer.includes('#bgkopMob.bgkop-mob'));

console.log('canonical brand shell contract: OK');
