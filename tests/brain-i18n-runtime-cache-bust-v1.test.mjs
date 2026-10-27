import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('public i18n behavior changes rotate the runtime asset identity',()=>{
  const apply=readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const runtime=readFileSync('assets/js/i18n.js','utf8');
  const skill=readFileSync('.agents/skills/powerhouse-green-assurance/SKILL.md','utf8');
  assert.match(apply,/const I18N_ASSET_VERSION = 'cms-i18n-20260930-\d+';/);
  assert.doesNotMatch(apply,/cms-i18n-20260929-5/);
  assert.match(runtime,/location\.assign\(/);
  assert.match(runtime,/event\.preventDefault\(\)/);
  assert.match(skill,/i18n-runtime-cache-bust-v1/);
});
