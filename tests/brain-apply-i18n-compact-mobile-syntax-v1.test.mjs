import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

test('apply-i18n parses and preserves compact mobile CTA while injecting language control', () => {
  execFileSync(process.execPath, ['--check','tools/site-shell/apply-i18n.mjs'], { stdio:'pipe' });
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/html\.replace\(cta, MOBILE_LANGUAGE \+ '\$&'\)/);
  assert.doesNotMatch(source,/MOBILE_LANGUAGE \+ 'function injectMobileLanguage/);
});
