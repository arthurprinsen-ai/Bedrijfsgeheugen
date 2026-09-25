import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const policy = JSON.parse(read('brain/policies/powerhouse-development-integration-v1.json'));

test('material development inherits Whole Brain + Portal + skill integration', () => {
  assert.equal(policy.fingerprint, 'development|whole-brain-portal-skill-integration|v1');
  for (const layer of ['evidence','knowledge','graph','semantics','signals','prediction','impact','decision','agents','delivery','learning','governance','resource']) {
    assert.ok(policy.brainImpactLayers.includes(layer), `missing Brain impact layer: ${layer}`);
  }
  assert.equal(policy.portal.noSurfaceRequiresReason, true);
  assert.equal(policy.systemMap.registrationRequiredOnStructuralChange, true);
  assert.equal(policy.learning.deterministicSkillProjectionRequired, true);
  assert.ok(policy.terminalRequires.includes('SYSTEM_MAP_CURRENT'));
  assert.ok(policy.terminalRequires.includes('PORTAL_READBACK_OR_NO_PORTAL_SURFACE'));
  assert.ok(policy.terminalRequires.includes('SKILL_PROJECTION_READBACK'));

  const agents = read('AGENTS.md');
  const continuity = read('.agents/skills/powerhouse-continuity/SKILL.md');
  const skill = read('.agents/skills/powerhouse-development-integration/SKILL.md');
  const systemMap = read('platform/system-map/canonical-system-map.mjs');

  assert.match(agents, /development\|whole-brain-portal-skill-integration\|v1/);
  assert.match(continuity, /powerhouse-development-integration/);
  assert.match(skill, /A material development change is never an isolated implementation/);
  assert.match(systemMap, /powerhouse-development-integration/);
});
