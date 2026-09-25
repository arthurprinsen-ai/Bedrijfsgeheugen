import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('apply-i18n still injects mobile language control when assets already exist',()=>{
  const source=fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.doesNotMatch(source,/if \(!\/<html\\b\/i\.test\(html\) \|\| \/data-bg-i18n-asset\/\.test\(html\)\) return/);
  assert.match(source,/if \(!\/data-bg-i18n-asset\/\.test\(html\)\)/);
  assert.match(source,/html = injectMobileLanguage\(html\)/);
  assert.match(source,/if \(html !== before\) fs\.writeFileSync/);
});

test('pricing source keeps i18n assets while build patch remains idempotent',()=>{
  const pricing=fs.readFileSync('prijzen.html','utf8');
  assert.match(pricing,/data-bg-i18n-asset/);
  const source=fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/data-bg-language-switcher="mobile"/);
  assert.match(source,/v18-mobile-drawer/);
});
