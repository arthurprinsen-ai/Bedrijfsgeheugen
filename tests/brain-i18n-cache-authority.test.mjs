import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('canonical i18n injector versions assets and replaces stale references', () => {
  const source = readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source, /I18N_ASSET_VERSION/);
  assert.match(source, /i18n\.js\?v=\$\{I18N_ASSET_VERSION\}/);
  assert.match(source, /i18n\.css\?v=\$\{I18N_ASSET_VERSION\}/);
  assert.match(source, /html = html\.replace\(scriptPattern, SCRIPT\)/);
  assert.match(source, /html = html\.replace\(cssPattern, LINK\)/);
});
