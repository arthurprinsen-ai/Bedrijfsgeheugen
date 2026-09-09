import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  finalizeNavigationHtml,
  verifyFinalNavigationHtml,
  assertIndexableRouteHtml,
} from '../tools/site-shell/finalize-site-contracts.mjs';
import { PUBLIC_PAGE_EXCLUDES } from '../tools/site-shell/contracts.mjs';

const staleHomepage = `<!doctype html><html><head><title>Home</title></head><body>
<header class="v17-header"><nav>
  <a href="https://www.bedrijfsgeheugen.nl/blog/" data-view="resources">Kennis</a>
  <a href="https://www.bedrijfsgeheugen.nl/blog/">Blog</a>
</nav></header>
<aside class="v18-mobile-drawer"><a href="https://www.bedrijfsgeheugen.nl/blog/" data-view="resources">Kennis</a><a href="https://www.bedrijfsgeheugen.nl/blog/">Blog</a></aside>
<main><h1>Home</h1></main></body></html>`;

const finalized = finalizeNavigationHtml(staleHomepage);
assert.ok(finalized.includes('href="https://www.bedrijfsgeheugen.nl/kennis/" data-view="resources">Kennis</a>'));
assert.ok(finalized.includes('href="https://www.bedrijfsgeheugen.nl/blog/">Blog</a>'));
assert.doesNotThrow(() => verifyFinalNavigationHtml(finalized, 'index.html'));
assert.throws(() => verifyFinalNavigationHtml(staleHomepage, 'index.html'), /Kennis.*blog|kennis\/|final/i);
assert.equal(finalizeNavigationHtml(finalized), finalized, 'finalizer moet idempotent zijn');

const kennisRoute = `<!doctype html><html><head>
<title>Kennisbank | Bedrijfsgeheugen</title>
<meta name="description" content="Gidsen, modellen en hulpmiddelen voor digitalisering, AI en kennisborging in het mkb.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://www.bedrijfsgeheugen.nl/kennis/">
</head><body><h1>Kennisbank</h1></body></html>`;
const blogRoute = kennisRoute.replaceAll('/kennis/', '/blog/').replaceAll('Kennisbank', 'Blog');
assert.doesNotThrow(() => assertIndexableRouteHtml(kennisRoute, 'https://www.bedrijfsgeheugen.nl/kennis/', 'kennis/index.html'));
assert.doesNotThrow(() => assertIndexableRouteHtml(blogRoute, 'https://www.bedrijfsgeheugen.nl/blog/', 'blog/index.html'));
assert.throws(() => assertIndexableRouteHtml(kennisRoute.replace('index, follow', 'noindex, follow'), 'https://www.bedrijfsgeheugen.nl/kennis/', 'kennis/index.html'), /noindex/i);

assert.ok(PUBLIC_PAGE_EXCLUDES.has('shell-gate-canonical-source.html'), 'canonical shell diagnostic source mag nooit als publieke route worden gevalideerd');
assert.ok(PUBLIC_PAGE_EXCLUDES.has('shell-gate-failed-page.html'), 'canonical shell failed-page artifact mag nooit als publieke route worden gevalideerd');

const releaseScript = await readFile(new URL('../tools/bouw-release-evidence.mjs', import.meta.url), 'utf8');
const isolatePos = releaseScript.indexOf('await isolateStandalonePages()');
const finalizePos = releaseScript.indexOf('await finalizeSiteContracts()');
assert.ok(isolatePos >= 0, 'release boundary moet standalone pagina-transformer blijven uitvoeren');
assert.ok(finalizePos > isolatePos, 'final navigation contract moet NA de laatste HTML-transformer draaien');

console.log('final site navigation contract: OK');
