import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('i18n runtime mounts mobile language control into active v18 drawer', () => {
  const source = fs.readFileSync('assets/js/i18n.js','utf8');
  assert.match(source,/document\.getElementById\('v18MobileDrawer'\)/);
  assert.match(source,/document\.getElementById\('bgkopMob'\)/);
  assert.match(source,/mountControl\(\)/);
  assert.match(source,/MutationObserver/);
});
