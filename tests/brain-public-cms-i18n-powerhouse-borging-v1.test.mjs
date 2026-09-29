import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public CMS i18n authority is projected across Powerhouse', () => {
  const agents = readFileSync('AGENTS.md','utf8');
  const map = readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
  const green = readFileSync('.agents/skills/powerhouse-green-assurance/SKILL.md','utf8');
  const continuity = readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
  const systemMap = readFileSync('.agents/skills/powerhouse-system-map-governance/SKILL.md','utf8');
  const chatPolicy = JSON.parse(readFileSync('brain/policies/chat-to-brain-completeness-v1.json','utf8'));
  const agentPolicy = JSON.parse(readFileSync('brain/policies/powerhouse-universal-agent-learning-writeback-v1.json','utf8'));

  for (const text of [agents, green, continuity, systemMap]) {
    assert.match(text, /powerhouse\|public-cms-i18n\|shared-shell-same-route\|v1/);
  }
  assert.match(map, /publicLocaleAuthority/);
  assert.match(map, /sameRouteInvariant:'\/x <-> \/en\/x; \/ <-> \/en\/'/);
  assert.equal(chatPolicy.public_cms_i18n_authority.fingerprint, 'powerhouse|public-cms-i18n|shared-shell-same-route|v1');
  assert.equal(agentPolicy.public_cms_i18n_authority.fingerprint, 'powerhouse|public-cms-i18n|shared-shell-same-route|v1');
});
