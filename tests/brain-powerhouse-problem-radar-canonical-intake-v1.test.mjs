import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('config/powerhouse-problem-radar-intake-contract.json','utf8'));
const skill = fs.readFileSync('skills/mkb-voice-of-customer-problem-radar.md','utf8');
const acquisition = fs.readFileSync('.agents/skills/trigger-based-mkb-acquisition/SKILL.md','utf8');

test('Problem Radar intake is one canonical store-and-route contract', () => {
  assert.equal(contract.fingerprint, 'powerhouse-problem-radar-canonical-intake-v1');
  assert.equal(contract.canonicalization.problem_library, 'config/powerhouse-problem-library.json');
  assert.equal(contract.canonicalization.map_to_existing_ph_problem_first, true);
  assert.equal(contract.canonicalization.parallel_problem_taxonomies_forbidden, true);
  assert.equal(contract.canonicalization.recurrence_preserved_without_duplicate_rows, true);
  assert.equal(contract.truth_model.external_evidence_is_tenant_fact, false);
  assert.deepEqual(contract.truth_model.allowed_impact_labels, ['OBSERVED','ESTIMATED','POTENTIAL']);
  assert.equal(contract.routing.canonical_problem_radar, true);
  assert.equal(contract.routing.executive_cockpit.why_powerhouse_says_this_evidence_drawer, true);
  assert.equal(contract.routing.content_pipeline.duplicate_angle_gate, true);
  assert.equal(contract.routing.content_pipeline.publication_readback_required, true);
  assert.equal(contract.routing.outcome_learning.verified_value_required_before_realized_value_claim, true);
  for (const field of ['source_url','source_date','problem_summary','business_impact','buying_trigger','freshness_status','confidence']) {
    assert.ok(contract.required_evidence_fields.includes(field));
  }
  for (const dim of ['recency','scale','urgency','buying_intent','powerhouse_relevance']) {
    assert.ok(contract.priority_dimensions.includes(dim));
  }
  assert.match(skill, /powerhouse-problem-radar-canonical-intake-v1/);
  assert.match(skill, /opslag.*portal.*content/is);
  assert.match(acquisition, /powerhouse-problem-radar-canonical-intake-v1/);
});
