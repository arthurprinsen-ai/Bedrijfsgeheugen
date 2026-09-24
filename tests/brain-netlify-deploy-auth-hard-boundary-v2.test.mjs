import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const learning = JSON.parse(fs.readFileSync('brain/learning/netlify-deploy-auth-hard-boundary-20260924-v2.json','utf8'));
const skill = fs.readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');

test('Netlify 401 is a deploy-auth hard boundary, not application failure', () => {
  assert.equal(learning.compiler.failure_class, 'DEPLOY_AUTH_HARD_BOUNDARY');
  assert.ok(learning.prevention.some(x => /401/.test(x)));
  assert.match(skill, /netlify-deploy-auth-hard-boundary-20260924-v2/);
  assert.match(skill, /BLOCKED_HARD_BOUNDARY/);
  assert.match(skill, /never embed proxy credentials/i);
  assert.match(skill, /release\.json/);
  assert.match(skill, /pricing\/i18n proof/);
});
