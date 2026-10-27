import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function buildPricing(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bg-pricing-i18n-'));
  fs.copyFileSync('prijzen.html',path.join(dir,'prijzen.html'));
  execFileSync(process.execPath,[path.resolve('tools/site-shell/apply-i18n.mjs')],{cwd:dir,stdio:'pipe'});
  return fs.readFileSync(path.join(dir,'prijzen.html'),'utf8');
}

test('pricing page carries both i18n assets exactly once after the i18n build step',()=>{
  const html=buildPricing();
  assert.match(html,/<link rel="stylesheet" href="\/assets\/i18n\.css[^"]*" data-bg-i18n-asset>/);
  assert.match(html,/<script src="\/assets\/js\/i18n\.js[^"]*" defer data-bg-i18n-asset><\/script>/);
  assert.equal((html.match(/\/assets\/js\/i18n\.js/g)||[]).length,1);
  assert.equal((html.match(/\/assets\/i18n\.css/g)||[]).length,1);
});
