import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');

test('contextual intelligence visibility is a cross-cutting Powerhouse invariant',()=>{
  const companySkill=read('.agents/skills/powerhouse-company-intelligence-os/SKILL.md');
  const mapSkill=read('.agents/skills/powerhouse-system-map-governance/SKILL.md');
  const systemMap=read('platform/system-map/canonical-system-map.mjs');
  assert.match(companySkill,/Contextual intelligence visibility invariant/);
  assert.match(companySkill,/material intelligence capability is incomplete until its customer-facing projection/i);
  assert.match(mapSkill,/Contextual visibility governance/);
  assert.match(mapSkill,/backend-only implementation is non-terminal/i);
  assert.match(systemMap,/contextualVisibilityRule:/);
});

test('visibility governance preserves evidence-first and contextual placement rules',()=>{
  const doc=read('docs/powerhouse/CONTEXTUAL_INTELLIGENCE_VISIBILITY_GOVERNANCE_V1.md');
  assert.match(doc,/Never fabricate intelligence when evidence is insufficient/);
  assert.match(doc,/Do not create a generic AI-insights dumping ground/);
  assert.match(doc,/prediction → action → outcome/);
});
