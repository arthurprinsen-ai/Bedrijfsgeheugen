import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public pages use static locale routes while portal keeps in-place fallback', () => {
  const source = fs.readFileSync('assets/js/i18n.js','utf8');
  const setLocaleBlock = source.slice(source.indexOf('async function setLocale'), source.indexOf('function closeMenus'));

  assert.match(setLocaleBlock,/if \(!isPortal\(\)\) \{[\s\S]*location\.assign\(localizedHref\(normalized\)\)/);
  assert.match(setLocaleBlock,/if \(normalized !== locale\) \{[\s\S]*locale = normalized;[\s\S]*localeEpoch \+= 1;[\s\S]*await apply\(document\.body\);/);
  assert.match(source,/const isPortal = \(\) =>/);
  assert.match(source,/const localizedHref = target =>/);
  assert.doesNotMatch(source,/Unprefixed public routes must switch in place/);
});
