import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLOBAL_COMPONENTS, componentHash, verifyPageShell, markCanonicalComponents } from './contracts.mjs';
import { extractComponent, replaceComponent } from './components.mjs';

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

const ruweV18 = `<!doctype html><body><header class="v17-header">header</header><aside class="v18-mobile-drawer" id="v18MobileDrawer">drawer</aside><footer>footer</footer></body>`;
const gemarkeerd = markCanonicalComponents(ruweV18);
assert.ok(gemarkeerd.includes('class="v18-mobile-drawer" id="v18MobileDrawer" data-bg-component="mobile-menu"'), 'v18-mobile-drawer moet de canonical MobileMenu-marker krijgen');

const afwijkend = canonical.replace('class="v17-header"', 'class="bgkop"');
assert.throws(() => verifyPageShell(afwijkend, 'prijzen.html'), /legacy|header|canonical/i);

const dubbeleFooter = canonical.replace('</body>', '<footer data-bg-component="footer">dubbel</footer></body>');
assert.throws(() => verifyPageShell(dubbeleFooter, 'dubbel.html'), /footer/i);

const pricingOk = canonical.replace('<main data-bg-component="main">body</main>', '<main data-bg-component="main">body<section data-bg-component="page-tools"><div class="bgx-vraagbalk"></div><div class="bgx-rekenaar"></div><div class="bgx-rol"></div></section></main>');
assert.doesNotThrow(() => verifyPageShell(pricingOk, 'prijzen.html'));
assert.throws(() => verifyPageShell(pricingOk, 'over-ons.html'), /pricing|page-tools/i);

const alleenPricingCss = canonical.replace('</head>', '<style>.bgx-vraagbalk{display:grid}.bgx-rekenaar{display:block}.bgx-rol{display:flex}</style></head>');
assert.doesNotThrow(() => verifyPageShell(alleenPricingCss, '404.html'), 'CSS selectors zijn geen zichtbare pricing-tools');

const oudeMain = extractComponent(canonical, 'main');
const oudeFooter = extractComponent(canonical, 'footer');
const nieuweHeader = '<header class="v17-header" data-bg-component="header"><nav>nieuw menu</nav></header>';
const alleenHeader = replaceComponent(canonical, 'header', nieuweHeader);
assert.equal(extractComponent(alleenHeader, 'main'), oudeMain, 'headerwissel mag main niet veranderen');
assert.equal(extractComponent(alleenHeader, 'footer'), oudeFooter, 'headerwissel mag footer niet veranderen');
assert.equal(extractComponent(alleenHeader, 'header'), nieuweHeader, 'alleen header moet vervangen worden');

const productionBuilder = await readFile('tools/bouw-v18-production.mjs', 'utf8');
assert.ok(productionBuilder.includes("./site-shell/apply-shell.mjs"), 'productiebouw moet de canonical shell-engine gebruiken');
assert.ok(!productionBuilder.includes("./uniforme-schil.mjs"), 'oude volledige schilkopie mag niet meer de productie-entrypoint zijn');

const normalizer = await readFile('tools/normaliseer-site-ui.mjs', 'utf8');
assert.ok(!normalizer.includes('PRICING_MOBILE_MENU_HTML'), 'pricing mag geen eigen mobiele menu-template meer hebben');
assert.ok(!normalizer.includes('#bgkopMob.bgkop-mob'), 'pricing mag geen eigen mobiele menu-CSS meer hebben');

console.log('canonical brand shell contract: OK');
