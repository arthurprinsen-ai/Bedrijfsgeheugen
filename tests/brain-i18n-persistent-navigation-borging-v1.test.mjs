import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('persistent public locale navigation is inherited by agents, skills, docs and system map', () => {
  const agents=fs.readFileSync('AGENTS.md','utf8');
  const delivery=fs.readFileSync('skills/powerhouse-production-nl-en-delivery.md','utf8');
  const continuity=fs.readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
  const governance=fs.readFileSync('.agents/skills/powerhouse-system-map-governance/SKILL.md','utf8');
  const map=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
  const site=fs.readFileSync('docs/sitestandaard.md','utf8');
  const learning=fs.readFileSync('brain/learning/2026-09-30-public-i18n-persistent-navigation-v1.json','utf8');
  for (const source of [agents,delivery,continuity,governance,map,site,learning]) {
    assert.match(source,/website\|i18n\|persistent-public-navigation\|v1/);
  }
  assert.match(map,/cross-page-locale-persistence/);
  assert.match(delivery,/Dynamically inserted menu\/navigation links|Dynamically inserted/);
  assert.match(agents,/dynamisch aangemaakte menu- en navigatielinks/);
});
