import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const agents=fs.readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
const skill=fs.readFileSync(new URL('../.agents/skills/powerhouse-toolchain-authority/SKILL.md',import.meta.url),'utf8');
const systemMap=fs.readFileSync(new URL('../platform/system-map/canonical-system-map.mjs',import.meta.url),'utf8');
const docs=fs.readFileSync(new URL('../docs/changes/2026-09-28-workshop-scan-persistent-portal-preprovision.md',import.meta.url),'utf8');

test('all chats and agents inherit the workshopscan single-lineage contract',()=>{
  assert.match(agents,/Workshopscan, PDF en klantportaal/);
  assert.match(agents,/submission_key/);
  assert.match(agents,/workshop_portal_intakes/);
  assert.match(agents,/portal_state_layers/);
  assert.match(skill,/iedere huidige en toekomstige chat, agent, skill en workflow/i);
  assert.match(skill,/preprovision het klantportaal/i);
});

test('system map exposes workshopscan as an existing Powerhouse capability',()=>{
  assert.match(systemMap,/id:'workshop-scan-customer-portal'/);
  assert.match(systemMap,/singleSubmissionKey:true/);
  assert.match(systemMap,/portalPreprovisionBeforeAccountClaim:true/);
  assert.match(systemMap,/aggregateLearningContainsPii:false/);
});

test('human documentation states the non-regression rule',()=>{
  assert.match(docs,/browser-only scan/i);
  assert.match(docs,/zelfde submission-lineage/i);
});
