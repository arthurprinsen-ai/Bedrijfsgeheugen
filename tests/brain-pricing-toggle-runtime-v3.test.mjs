import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing rescue forces visible state instead of relying on hidden alone', () => {
  const source = fs.readFileSync('assets/js/pricing-interactions-rescue-v1.js','utf8');
  assert.match(source,/panel\.style\.setProperty\('display','block','important'\)/);
  assert.match(source,/panel\.style\.setProperty\('display','none','important'\)/);
  assert.match(source,/card\.style\.display = active \? '' : 'none'/);
  assert.match(source,/ready-v3/);
});

test('pricing page cache-busts the repaired runtime', () => {
  const html = fs.readFileSync('prijzen.html','utf8');
  assert.match(html,/pricing-interactions-rescue-v1\.js\?v=[a-f0-9]{12}/);
});


test('billing rescue keeps aria-selected and aria-pressed synchronized', () => {
  const source = fs.readFileSync('assets/js/pricing-interactions-rescue-v1.js','utf8');
  assert.match(source,/button\.setAttribute\('aria-pressed', String\(active\)\)/);
  assert.match(source,/button\.setAttribute\('aria-selected', String\(active\)\)/);
});
