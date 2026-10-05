import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('production locale readback uses navigation-commit route proof and remains fail-closed',()=>{
  const verifier=readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  const skill=readFileSync('.agents/skills/powerhouse-green-assurance/SKILL.md','utf8');
  assert.match(verifier,/waitForURL[\s\S]*waitUntil:'commit'/);
  assert.match(verifier,/waitForURL[\s\S]*timeout:30_000/);
  assert.match(verifier,/locator\('body'\)\.waitFor\(\{ state:'visible', timeout:15_000 \}\)/);
  assert.match(verifier,/path === expected/);
  assert.match(verifier,/html lang=/);
  assert.match(verifier,/English route still shows the Dutch pricing H1/);
  assert.match(skill,/Browser navigation readback/);
  assert.match(skill,/i18n-production-navigation-readback-20260930-v1/);
});
