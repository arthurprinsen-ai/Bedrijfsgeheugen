import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const acquisition = readFileSync(new URL('../.agents/skills/trigger-based-mkb-acquisition/SKILL.md', import.meta.url),'utf8');
const incident = readFileSync(new URL('../docs/changes/2026-11-01-first-paid-order-commercial-truth.md', import.meta.url),'utf8');

test('canonical first order acquisition skill uses current validated paid entry products, not stale scan pricing', () => {
  assert.match(acquisition, /Directie & AI Workshop €1\.950/);
  assert.match(acquisition, /Bedrijfsgeheugen Scan €2\.950/);
  assert.match(acquisition, /gratis Frisse Blik/);
  assert.doesNotMatch(acquisition, /paid scan \(€2\.900\)/);
});

test('paid order requires independent payment proof and source-gate failures do not authorize sends', () => {
  assert.match(acquisition, /payment\/provider-verificatie/);
  assert.match(acquisition, /SOURCE_SPECIFIC_EVIDENCE_REQUIRED/);
  assert.match(incident, /provider_attempted=false/);
  assert.match(incident, /geen nieuwe scheduler\/CRM\/parallelle agent/);
});

test('commercial measurement keeps internal research separate from external outreach', () => {
  assert.match(acquisition, /7\.425 daarvan `research_enrichment` intern/);
  assert.match(incident, /7\.425 `research_enrichment`/);
  assert.match(acquisition, /noemers/);
});
