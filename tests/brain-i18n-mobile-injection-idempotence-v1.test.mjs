import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n injects mobile language control even when i18n assets already exist', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.doesNotMatch(source,/if \(!\/<html\\b\/i\.test\(html\) \|\| \/data-bg-i18n-asset\/\.test\(html\)\) return/);
  assert.match(source,/const hasLink = .*i18n\\\.css/);
  assert.match(source,/const hasScript = .*i18n\\\.js/);
  assert.match(source,/if \(!hasLink\) assets\.push\(LINK\)/);
  assert.match(source,/if \(!hasScript\) assets\.push\(SCRIPT\)/);
  assert.match(source,/html = injectMobileLanguage\(html\);/);
});

test('compact and v18 mobile hosts keep selector injection idempotent', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/if \(\/data-bg-language-switcher="mobile"\/\.test\(html\)\) return html/);
  assert.match(source,/v18-mobile-drawer/);
  assert.match(source,/bgkopMob/);
  assert.match(source,/MOBILE_LANGUAGE/);
});
