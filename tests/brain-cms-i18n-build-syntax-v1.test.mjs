import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('CMS i18n build injector is syntactically valid', () => {
  const result = spawnSync(process.execPath,['--check','tools/site-shell/apply-i18n.mjs'],{encoding:'utf8'});
  assert.equal(result.status,0,(result.stderr||result.stdout||'node --check failed').trim());
});

test('legacy mobile CTA injection preserves same-page language links without malformed replacement source', () => {
  const source=fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/mobileLanguage \+ '\$&'/);
  assert.doesNotMatch(source,/MOBILE_LANGUAGE \+/);
  assert.match(source,/function canonicalRoute\(locale,route\)/);
  assert.match(source,/const en = canonicalRoute\('en',route\)/);
  assert.match(source,/data-bg-language-option="en"/);
  assert.match(source,/data-bg-language-option="nl"/);
});
