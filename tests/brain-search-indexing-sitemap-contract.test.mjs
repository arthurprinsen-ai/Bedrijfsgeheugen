import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production build regenerates sitemap from final HTML output', async () => {
  // Production and previews run the shared build entry, which owns the ordered SEO pipeline.
  const netlify = await readFile('tools/ci/netlify-build-entry.mjs', 'utf8');
  assert.ok((await readFile('netlify.toml', 'utf8')).includes('node tools/ci/netlify-build-entry.mjs'));
  const localized = netlify.indexOf("'tools/site-shell/build-localized-routes.mjs'");
  const revenueLinks = netlify.indexOf("'tools/seo-order-engine/apply-revenue-links.mjs'");
  const sitemap = netlify.indexOf("'tools/genereer-sitemap.mjs'");
  const localeValidation = netlify.indexOf("'tools/seo-order-engine/validate-locales.mjs'");
  const evidence = netlify.indexOf("'tools/bouw-release-evidence.mjs'");
  assert.ok(localized >= 0 && revenueLinks > localized && sitemap > revenueLinks && localeValidation > sitemap && evidence > localeValidation,
    'Netlify must localize, project revenue links, generate sitemap, validate locales and only then build release evidence');
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


test('website lane mirrors the full bilingual Netlify SEO pipeline', async () => {
  // The website lane runs the very same build entry as Netlify, so the ordered chain is checked there.
  assert.match(await readFile('.github/workflows/lane-website.yml', 'utf8'), /node tools\/ci\/netlify-build-entry\.mjs/);
  const workflow = await readFile('tools/ci/netlify-build-entry.mjs', 'utf8');
  const ordered=[
    "'tools/seo-order-engine/apply.mjs'",
    "'tools/seo-order-engine/validate.mjs'",
    "'tools/site-shell/apply-i18n.mjs'",
    "'tools/site-shell/build-localized-routes.mjs'",
    "'tools/seo-order-engine/apply-revenue-links.mjs'",
    "'tools/genereer-sitemap.mjs'",
    "'tools/seo-order-engine/validate-locales.mjs'",
    "'tools/bouw-release-evidence.mjs'"
  ];
  let cursor=-1;
  for(const step of ordered){
    const next=workflow.indexOf(step,cursor+1);
    assert.ok(next>cursor, `website build parity must include ordered step: ${step}`);
    cursor=next;
  }
});
