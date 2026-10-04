import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pre-write obligation recovery is projected across canonical contracts', async () => {
  const [agents, continuity, skill, systemMap] = await Promise.all([
    readFile('AGENTS.md','utf8'),
    readFile('brain/policies/powerhouse-agent-continuity-v1.json','utf8'),
    readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8'),
    readFile('platform/system-map/canonical-system-map.mjs','utf8')
  ]);
  const fingerprint='powerhouse|prewrite-obligation|external-mutation-recovery|v1';
  for (const source of [agents, continuity, skill, systemMap]) assert.match(source, new RegExp(fingerprint.replace(/[|]/g,'\\|')));
  assert.match(agents,/obligation.*vóór.*GitHub|vóór.*eerste GitHub/s);
  assert.match(continuity,/PREWRITE_OBLIGATION_BEFORE_EXTERNAL_MUTATION/);
  assert.match(continuity,/RECOVERY_REQUIRED/);
  assert.match(skill,/protected GitHub publisher/);
  assert.match(systemMap,/blogClosesOnProductionReadback:true/);
  assert.match(systemMap,/linkedinCompanyReadAclNotWritePrerequisite:true/);
});
