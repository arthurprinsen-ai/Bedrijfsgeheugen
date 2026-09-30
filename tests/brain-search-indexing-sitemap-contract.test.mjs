import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production build regenerates sitemap from final HTML output', async () => {
  const netlify = await readFile('netlify.toml', 'utf8');
  const localized = netlify.indexOf('node tools/site-shell/build-localized-routes.mjs');
  const revenueLinks = netlify.indexOf('node tools/seo-order-engine/apply-revenue-links.mjs');
  const sitemap = netlify.indexOf('node tools/genereer-sitemap.mjs');
  const localeValidation = netlify.indexOf('node tools/seo-order-engine/validate-locales.mjs');
  const evidence = netlify.indexOf('node tools/bouw-release-evidence.mjs');
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
  const workflow = await readFile('.github/workflows/lane-website.yml', 'utf8');
  const ordered=[
    'node tools/seo-order-engine/apply.mjs',
    'node tools/seo-order-engine/validate.mjs',
    'node tools/site-shell/apply-i18n.mjs',
    'node tools/site-shell/build-localized-routes.mjs',
    'node tools/seo-order-engine/apply-revenue-links.mjs',
    'node tools/genereer-sitemap.mjs',
    'node tools/seo-order-engine/validate-locales.mjs',
    'node tools/bouw-release-evidence.mjs'
  ];
  let cursor=-1;
  for(const step of ordered){
    const next=workflow.indexOf(step,cursor+1);
    assert.ok(next>cursor, `website build parity must include ordered step: ${step}`);
    cursor=next;
  }
});
