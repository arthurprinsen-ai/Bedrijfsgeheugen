import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canonicalNetlifyBuild, phaseIndex } from './brain-netlify-canonical-build-source.mjs';

test('production build regenerates sitemap from final HTML output', () => {
  const {phases}=canonicalNetlifyBuild();
  const chain=[
    ['localized-routes','tools/site-shell/build-localized-routes.mjs'],
    ['revenue-links','tools/seo-order-engine/apply-revenue-links.mjs'],
    ['sitemap','tools/genereer-sitemap.mjs'],
    ['locale-validation','tools/seo-order-engine/validate-locales.mjs'],
    ['release-evidence','tools/bouw-release-evidence.mjs'],
  ];
  const indexes=chain.map(([name,script])=>phaseIndex(phases,name,script));
  assert.deepEqual(indexes,[...indexes].sort((a,b)=>a-b),'localization, sitemap, locale checks and release evidence must remain ordered');
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
  const workflow=await readFile('.github/workflows/lane-website.yml','utf8');
  assert.match(workflow,/node tools\/ci\/netlify-build-entry\.mjs/);
  const {phases}=canonicalNetlifyBuild();
  const ordered=[
    ['seo-apply','tools/seo-order-engine/apply.mjs'],
    ['seo-validate','tools/seo-order-engine/validate.mjs'],
    ['i18n-assets','tools/site-shell/apply-i18n.mjs'],
    ['localized-routes','tools/site-shell/build-localized-routes.mjs'],
    ['revenue-links','tools/seo-order-engine/apply-revenue-links.mjs'],
    ['sitemap','tools/genereer-sitemap.mjs'],
    ['locale-validation','tools/seo-order-engine/validate-locales.mjs'],
    ['release-evidence','tools/bouw-release-evidence.mjs'],
  ];
  const indexes=ordered.map(([name,script])=>phaseIndex(phases,name,script));
  assert.deepEqual(indexes,[...indexes].sort((a,b)=>a-b),'website production SEO phases must keep their actual canonical order');
});
