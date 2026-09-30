import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production build regenerates sitemap from final HTML output', async () => {
  const netlify = await readFile('netlify.toml', 'utf8');
  const localized = netlify.indexOf('node tools/site-shell/build-localized-routes.mjs');
  const revenueLinks = netlify.indexOf('node tools/seo-order-engine/apply-revenue-links.mjs');
  const sitemap = netlify.indexOf('node tools/genereer-sitemap.mjs');
  const localeGate = netlify.indexOf('node tools/seo-order-engine/validate-locales.mjs');
  const evidence = netlify.indexOf('node tools/bouw-release-evidence.mjs');
  assert.ok(
    localized >= 0 && revenueLinks > localized && sitemap > revenueLinks && localeGate > sitemap && evidence > localeGate,
    'Netlify must generate localized routes, project revenue links, regenerate sitemap, validate locale SEO, then write release evidence'
  );
});

test('explicit geenIndex views override inherited robots metadata', async () => {
  const source = await readFile('tools/bouw-v18-views.mjs', 'utf8');
  assert.match(source, /if \(p\.geenIndex\) \{/);
  assert.match(source, /robotsTag\.test\(html\)/);
  assert.match(source, /<meta name="robots" content="noindex, follow">/);
});

test('sitemap generator excludes noindex and only emits final canonical URLs', async () => {
  const source = await readFile('tools/genereer-sitemap.mjs', 'utf8');
  assert.match(source, /await finalizeSiteContracts\(\)/);
  assert.match(source, /if \(!html\.includes\('<body'\) \|\| noindex\(html\)\) continue/);
  assert.match(source, /const url = canonical\(html\)/);
  assert.match(source, /if \(!url\.startsWith\(\x60\$\{ORIGIN\}\//);
});
