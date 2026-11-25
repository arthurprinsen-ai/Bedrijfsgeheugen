import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('apply-i18n injects runtime script independently from existing CSS', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/const hasI18nCss =/);
  assert.match(source,/const hasI18nScript =/);
  assert.match(source,/!hasI18nCss \? LINK/);
  assert.match(source,/!hasI18nScript \? SCRIPT/);
  assert.doesNotMatch(source,/\|\| \/data-bg-i18n-asset\/\.test\(html\)\) return/);
  assert.match(source,/html = injectMobileLanguage\(html,\s*file\)/);
});

test('canonical pricing source contains both i18n assets after build contract repair', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'bg-i18n-ind-'));
  fs.copyFileSync('prijzen.html',path.join(dir,'prijzen.html'));
  execFileSync(process.execPath,[path.resolve('tools/site-shell/apply-i18n.mjs')],{cwd:dir,stdio:'pipe'});
  const html = fs.readFileSync(path.join(dir,'prijzen.html'),'utf8');
  assert.match(html,/assets\/i18n\.css/);
  assert.match(html,/assets\/js\/i18n\.js/);
});
