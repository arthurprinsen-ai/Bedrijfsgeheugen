import assert from 'node:assert/strict';
import { GLOBAL_COMPONENTS, componentHash, verifyPageShell, markCanonicalComponents } from './contracts.mjs';
import { extractComponent, replaceComponent } from './components.mjs';
import { CANONICAL_SHELL_SOURCE, extractPageMain, projectGlobalComponents } from './apply-shell.mjs';
import { ensureKnowledgeNavigation, verifyKnowledgeNavigation } from './ensure-knowledge-nav.mjs';
import { normaliseerHtml } from '../normaliseer-site-ui.mjs';

const canonical = `<!doctype html><html><head></head><body>
<header class="v17-header" data-bg-component="header"><nav><a href="/">Home</a></nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-drawer"><a href="/">Home</a></aside>
<main data-bg-component="main"><section>eigen inhoud</section></main>
<footer class="v17-footer" data-bg-component="footer">footer</footer>
</body></html>`;

const page = `<!doctype html><html><head></head><body>
<header class="v17-header" data-bg-component="header"><nav><a href="/oud">Oud</a></nav></header>
<aside class="v18-mobile-drawer" data-bg-component="mobile-drawer"><a href="/oud">Oud</a></aside>
<main data-bg-component="main"><section>pagina-inhoud</section></main>
<footer class="v17-footer" data-bg-component="footer">oude footer</footer>
</body></html>`;

assert.equal(CANONICAL_SHELL_SOURCE, 'over-ons.html');
const markedCanonical = markCanonicalComponents(canonical);
for (const name of GLOBAL_COMPONENTS) assert.ok(extractComponent(markedCanonical, name), `canonical mist ${name}`);
const projected = projectGlobalComponents(page, canonical);
assert.equal(extractPageMain(projected), '<section>pagina-inhoud</section>');
assert.equal(componentHash(extractComponent(projected, 'header')), componentHash(extractComponent(markedCanonical, 'header')));
assert.equal(componentHash(extractComponent(projected, 'mobile-drawer')), componentHash(extractComponent(markedCanonical, 'mobile-drawer')));
assert.equal(componentHash(extractComponent(projected, 'footer')), componentHash(extractComponent(markedCanonical, 'footer')));
assert.ok(verifyPageShell(projected, markedCanonical).ok);

const normalized = normaliseerHtml(projected, { pad: 'test.html' });
assert.ok(extractComponent(normalized, 'header'));
assert.ok(extractComponent(normalized, 'mobile-drawer'));
assert.ok(extractComponent(normalized, 'footer'));
assert.equal(extractPageMain(normalized), '<section>pagina-inhoud</section>');

const oudeMain = extractComponent(canonical, 'main');
const oudeFooter = extractComponent(canonical, 'footer');
const nieuweHeader = '<header class="v17-header" data-bg-component="header"><nav>nieuw menu</nav></header>';
const alleenHeader = replaceComponent(canonical, 'header', nieuweHeader);
assert.equal(extractComponent(alleenHeader, 'main'), oudeMain);
assert.equal(extractComponent(alleenHeader, 'footer'), oudeFooter);
assert.equal(extractComponent(alleenHeader, 'header'), nieuweHeader);

const legacyKnowledgeNav = `<nav class="bgkop"><div class="bgkop-paneel"><a href="/blog/"><b>Blog</b><span>Wat we tegenkomen, uitgelegd zonder jargon</span></a></div><button class="bgkop-macc" type="button">Kennis<svg></svg></button><div class="bgkop-mpaneel" hidden><a href="/blog/">Blog</a></div></nav>`;
const knowledgeNav = ensureKnowledgeNavigation(legacyKnowledgeNav);
assert.ok(verifyKnowledgeNavigation(knowledgeNav), 'Kennisbank en Blog moeten aparte desktop- en mobiele bestemmingen zijn');
assert.ok(knowledgeNav.indexOf('href="https://www.bedrijfsgeheugen.nl/kennis"><b>Kennisbank</b>') < knowledgeNav.indexOf('href="https://www.bedrijfsgeheugen.nl/blog/"><b>Blog</b>'));
assert.ok(knowledgeNav.includes('href="https://www.bedrijfsgeheugen.nl/kennis">Kennisbank</a>'));
const kennisHrefs = [...knowledgeNav.matchAll(/\bhref="([^"]+)"/g)].map(([, href]) => href);
assert.ok(kennisHrefs.every((href) => /^https:\/\/www\.bedrijfsgeheugen\.nl\//.test(href)), 'alle hrefs in de genormaliseerde kennisnavigatie moeten absolute bedrijfsgeheugen.nl URLs zijn');
assert.equal(ensureKnowledgeNavigation(knowledgeNav), knowledgeNav, 'Kennisnavigatie-normalisatie moet idempotent zijn');

console.log('canonical brand shell contract: OK');