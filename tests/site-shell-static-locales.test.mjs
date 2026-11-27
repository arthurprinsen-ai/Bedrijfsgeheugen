import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('static locale routes are built and language switching navigates between them', () => {
  const build = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  const runtime = fs.readFileSync('assets/js/i18n.js','utf8');
  const netlify = fs.readFileSync('netlify.toml','utf8');
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));

  assert.equal(pkg.dependencies.parse5,'8.1.1');
  assert.equal(pkg.dependencies['@netlify/blobs'],'11.1.11');
  assert.equal(pkg.dependencies['@netlify/identity'],'2.0.1');
  assert.match(netlify,/command = "node tools\/ci\/netlify-build-entry\.mjs"/);
  const entry = fs.readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
  assert.match(entry,/\['localized-routes','tools\/site-shell\/build-localized-routes\.mjs'\]/);
  assert.match(build,/const LOCALES = \['nl','en'\]/);
  assert.match(build,/hreflang/);
  assert.match(build,/x-default/);
  assert.match(build,/data-bg-static-locale/);
  const transport = fs.readFileSync('tools/site-shell/static-i18n-openai-fallback.mjs','utf8');
  assert.match(build,/OPENAI_API_KEY/);
  assert.match(build,/translateBatchWithOpenAI\(part,key\)/);
  assert.match(transport,/model = 'gpt-5-mini'/);
  assert.match(transport,/store: false/);
  assert.match(transport,/strict: true/);
  assert.match(transport,/OPENAI_I18N_IMMUTABLE_TOKEN_MISMATCH/);
  assert.match(build,/STATIC_I18N_ROUTES/);
  assert.match(build,/publicRoutesFromSitemap/);
  assert.match(build,/ESSENTIAL_ROUTES/);
  assert.match(build,/applyTranslations/);
  assert.match(build,/chars \+ source\.length > 3200/);
  assert.match(build,/STATIC_I18N_CONCURRENCY/);
  assert.match(build,/Promise\.all/);
  assert.match(build,/Math\.min\(4/);
  assert.match(build,/rewriteLinks/);

  assert.match(runtime,/pathLocale/);
  assert.match(runtime,/localizedHref/);
  assert.match(runtime,/location\.assign\(localizedHref\(normalized\)\)/);
  assert.match(runtime,/locale = portal \? preferredLocale\(\) : \(routed \|\| 'nl'\)/);
  assert.match(runtime,/window\.location\.assign\(localizedHref\(target\)\)/);
  assert.match(runtime,/window\.location\.assign\(href\)/);
  assert.doesNotMatch(runtime,/location\.replace\(localizedHref\('en'\)\)/);
  assert.match(runtime,/document\.documentElement\.dataset\.bgStaticTranslated !== 'false'/);
  assert.match(runtime,/routed === 'en' && !staticTranslated/);
});

test('offline production builds still emit English routes with explicit runtime fallback', () => {
  const build = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(build,/data-bg-static-translated/);
  assert.match(build,/setLocaleMetadata\(enDoc,'en',route,missingForRoute\.length===0\)/);
  assert.match(build,/const enDoc\s*=\s*parse\(sourceHtml\)/);
  assert.match(build,/const enSerialized=serialize\(enDoc\)/);
  assert.match(build,/fs\.writeFileSync\(enOut,enSerialized\)/);
  assert.match(build,/allowMissing:!productionTranslationRequired/);
  assert.match(build,/untranslatedRefs\+=missingForRoute\.length/);
  assert.match(build,/runtimeFallback:!translations\s*\|\|\s*aggregate\.untranslatedRefs > 0/);
  assert.match(build,/Missing static English translation/);
  const transport = fs.readFileSync('tools/site-shell/static-i18n-openai-fallback.mjs','utf8');
  assert.match(transport,/OPENAI_I18N_RESPONSE_SHAPE_INVALID/);
  assert.match(transport,/assertFaithfulTranslationBatch\(strings, value\?\.translations\)/);
  assert.match(build,/translateResilient/);
});
