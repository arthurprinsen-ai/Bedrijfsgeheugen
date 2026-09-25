import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n does not skip mobile control injection when i18n assets already exist', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.doesNotMatch(source,/if \(!\/<html\\b\/i\.test\(html\) \|\| \/data-bg-i18n-asset\/\.test\(html\)\) return;/);
  assert.match(source,/if \(!\/data-bg-i18n-asset\/\.test\(html\)\) \{/);
  assert.match(source,/html = injectMobileLanguage\(html\);/);
  assert.match(source,/if \(html !== before\) fs\.writeFileSync\(file,html\);/);
});
