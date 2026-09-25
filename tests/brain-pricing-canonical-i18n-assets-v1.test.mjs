import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('canonical pricing source always carries i18n assets',()=>{
  const html=fs.readFileSync('prijzen.html','utf8');
  assert.match(html,/<link rel="stylesheet" href="\/assets\/i18n\.css" data-bg-i18n-asset>/);
  assert.match(html,/<script src="\/assets\/js\/i18n\.js" defer data-bg-i18n-asset><\/script>/);
  assert.equal((html.match(/\/assets\/js\/i18n\.js/g)||[]).length,1);
  assert.equal((html.match(/\/assets\/i18n\.css/g)||[]).length,1);
});
