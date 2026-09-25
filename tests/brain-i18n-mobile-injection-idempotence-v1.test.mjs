import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n injects mobile language control even when i18n assets already exist', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.doesNotMatch(source,/if \(!\/<html\\b\/i\.test\(html\) \|\| \/data-bg-i18n-asset\/\.test\(html\)\) return/);
  assert.match(source,/if \(!\/data-bg-i18n-asset\/\.test\(html\)\) \{/);
  assert.match(source,/html = injectMobileLanguage\(html\);/);
});

test('compact mobile host keeps selector injection idempotent', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/if \(\/data-bg-language-switcher="mobile"\/\.test\(html\)\) return html/);
  assert.match(source,/MOBILE_LANGUAGE \+ match/);
});


test('existing i18n assets never short-circuit mobile control injection', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const patch = source.slice(source.indexOf('function patch(file)'));
  assert.match(patch,/if \(!\/<html\\b\/i\.test\(html\)\) return/);
  assert.match(patch,/if \(!\/data-bg-i18n-asset\/\.test\(html\)\) \{/);
  assert.ok(patch.indexOf('html = injectMobileLanguage(html);') > patch.indexOf("if (!/data-bg-i18n-asset/.test(html)) {"));
});
