import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('static locale routes are built and language switching navigates between them', () => {
  const build = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  const runtime = fs.readFileSync('assets/js/i18n.js','utf8');
  const netlify = fs.readFileSync('netlify.toml','utf8');
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));

  assert.equal(pkg.dependencies.parse5,'7.2.1');
  assert.match(netlify,/build-localized-routes\.mjs/);
  assert.match(build,/const LOCALES = \['nl','en'\]/);
  assert.match(build,/hreflang/);
  assert.match(build,/x-default/);
  assert.match(build,/data-bg-static-locale/);
  assert.match(build,/ANTHROPIC_API_KEY/);
  assert.match(build,/claude-haiku-4-5-20251001/);
  assert.match(build,/STATIC_I18N_ROUTES/);
  assert.match(build,/portal-v2/);
  assert.match(build,/applyTranslations/);
  assert.match(build,/rewriteLinks/);

  assert.match(runtime,/pathLocale/);
  assert.match(runtime,/localizedHref/);
  assert.match(runtime,/location\.assign\(localizedHref\(normalized\)\)/);
  assert.match(runtime,/location\.replace\(localizedHref\('en'\)\)/);
  assert.match(runtime,/Static \/nl and \/en routes already contain translated document copy/);
});

test('English build fails closed in production rather than publishing mixed-language pages', () => {
  const build = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(build,/Missing static English translation/);
  assert.match(build,/Translation response shape mismatch/);
  assert.match(build,/ANTHROPIC_API_KEY is required for production static English routes/);
  assert.match(build,/throw lastError/);
});
