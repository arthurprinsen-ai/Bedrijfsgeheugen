import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectBlog, enrichBlog } from '../tools/seo-order-engine/blog-contract.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const registry = {
  version: 1,
  pages: [
    {
      route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb',
      secondary_keywords: ['wat kost digitalisering mkb', 'prijzen digitalisering mkb'], funnel_stage: 'decide',
      primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }, supporting_routes: [], schema_type: 'Service'
    }
  ]
};

function basisBlog({ evidence = true } = {}) {
  return `<!doctype html><html lang="nl"><head>
    <title>Wat kost digitalisering mkb?</title>
    <meta name="description" content="Een concreet artikel over kosten en keuzes.">
    <meta name="robots" content="index, follow">
    <meta name="bg-zoekwoord" content="wat kost digitalisering mkb">
    <meta property="article:published_time" content="2026-09-01">
    <meta property="article:modified_time" content="2026-09-05">
    <link rel="canonical" href="${ORIGIN}/blog/wat-kost-digitalisering-mkb/">
  </head><body>
    <nav aria-label="Kruimelpad"><a href="${ORIGIN}/">Home</a><a href="${ORIGIN}/blog/">Kennis</a></nav>
    <main><article><h1>Wat kost digitalisering mkb?</h1>
      <p>Een praktisch antwoord met concrete bedragen.</p>
      ${evidence ? `<section data-bg-evidence><h2>Bronnen en onderbouwing</h2><p>Gebaseerd op concrete procesberekeningen.</p></section>` : ''}
      <p><a href="${ORIGIN}/product">Bekijk het platform</a> en <a href="${ORIGIN}/bedrijfsgeheugen">lees over kennisborging</a>.</p>
    </article></main>
  </body></html>`;
}

test('nieuw blog zonder order-enrichment faalt op auteur money-link CTA en graph', () => {
  const fouten = inspectBlog(basisBlog(), 'blog/wat-kost-digitalisering-mkb/index.html', registry).join('\n');
  assert.match(fouten, /auteur\/reviewer ontbreekt/i);
  assert.match(fouten, /dominante money page/i);
  assert.match(fouten, /primaire CTA/i);
  assert.match(fouten, /SEO order graph/i);
});

test('enrichment maakt een bewijsrijk blog idempotent publiceerbaar', () => {
  const once = enrichBlog(basisBlog(), 'blog/wat-kost-digitalisering-mkb/index.html', registry);
  const twice = enrichBlog(once, 'blog/wat-kost-digitalisering-mkb/index.html', registry);
  assert.equal(once, twice);
  assert.ok(once.includes('data-bg-author="arthur-prinsen"'));
  assert.ok(once.includes('datetime="2026-09-05"'));
  assert.ok(once.includes(`href="${ORIGIN}/prijzen"`));
  assert.ok(once.includes('data-bg-order-cta'));
  assert.ok(once.includes('id="bg-seo-order-graph"'));
  assert.deepEqual(inspectBlog(once, 'blog/wat-kost-digitalisering-mkb/index.html', registry), []);
});

test('enrichment verzint geen bewijs: artikel zonder onderbouwing blijft geblokkeerd', () => {
  const enriched = enrichBlog(basisBlog({ evidence: false }), 'blog/wat-kost-digitalisering-mkb/index.html', registry);
  assert.match(inspectBlog(enriched, 'blog/wat-kost-digitalisering-mkb/index.html', registry).join('\n'), /bewijs\/bronnen ontbreekt/i);
});

test('zichtbare Nederlandse publicatiedatum blijft bruikbaar als oude JSON-LD datum onderweg is verdwenen', () => {
  const html = `<!doctype html><html lang="nl"><head>
    <title>Wat kost digitalisering mkb?</title>
    <meta name="description" content="Een concreet artikel over kosten en keuzes.">
    <meta name="robots" content="index, follow">
    <meta name="bg-zoekwoord" content="wat kost digitalisering mkb">
    <link rel="canonical" href="${ORIGIN}/blog/wat-kost-digitalisering-mkb/">
  </head><body><main><article>
    <div class="artikelmeta"><span>19 augustus 2026</span><span>Arthur Prinsen</span></div>
    <h1>Wat kost digitalisering mkb?</h1>
    <section data-bg-evidence><h2>Voorbeeldberekening</h2><p>Een transparante berekening.</p></section>
    <p><a href="${ORIGIN}/product">Platform</a> en <a href="${ORIGIN}/bedrijfsgeheugen">kennisborging</a>.</p>
  </article></main></body></html>`;
  const enriched = enrichBlog(html, 'blog/wat-kost-digitalisering-mkb/index.html', registry);
  assert.ok(enriched.includes('datetime="2026-08-19"'), 'zichtbare datum wordt semantische <time>');
  assert.deepEqual(inspectBlog(enriched, 'blog/wat-kost-digitalisering-mkb/index.html', registry), []);
});
