import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('unprefixed pages switch locale in place instead of depending on /en routes', () => {
  const source = fs.readFileSync('assets/js/i18n.js','utf8');
  assert.match(source,/locale = normalized;/);
  assert.match(source,/localeEpoch \+= 1;/);
  assert.match(source,/await apply\(document\.body\);/);
  assert.match(source,/if \(locale !== 'en'\) return;/);
  assert.doesNotMatch(source,/if \(!routed && locale === 'en'\) \{\s*location\.replace/);
});
