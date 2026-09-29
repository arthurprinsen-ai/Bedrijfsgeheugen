import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public language switch is route-driven and build-owned', () => {
  const injector = readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const runtime = readFileSync('assets/js/i18n.js','utf8');
  const builder = readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');

  assert.match(injector, /data-bg-language-option="nl" hreflang="nl"/);
  assert.match(injector, /data-bg-language-option="en" hreflang="en"/);
  assert.doesNotMatch(injector, /data-bg-language-select/);

  assert.match(runtime, /href="' \+ localizedHref\('nl'\)/);
  assert.match(runtime, /href="' \+ localizedHref\('en'\)/);
  assert.match(runtime, /if \(isPortal\(\)\) \{/);

  assert.match(builder, /function rewriteLanguageSwitchers\(doc,route,activeLocale\)/);
  assert.match(builder, /setAttr\(node,'href',canonicalRoute\(target,route\)\)/);
  assert.match(builder, /rewriteLanguageSwitchers\(nlDoc,route,'nl'\)/);
  assert.match(builder, /rewriteLanguageSwitchers\(enDoc,route,'en'\)/);
});
