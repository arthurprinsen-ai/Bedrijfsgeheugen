import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enrichKnowledgeEntity,
  calculateDataHealth,
  detectCommercialSignals,
  scoreOpportunity,
} from '../brain/knowledge/universal-enrichment-signal-engine.mjs';

const at = '2026-09-14T12:00:00.000Z';

function evidence(source, value, confidence = 0.8, observedAt = at) {
  return { source, value, confidence, observed_at: observedAt };
}

test('waterfall enrichment keeps evidence lineage, merges corroboration and stops once a field is strong enough', async () => {
  const calls = [];
  const providers = [
    { id: 'provider-a', priority: 10, async enrich() { calls.push('provider-a'); return { industry: evidence('provider-a', 'Manufacturing', 0.78), employee_count: evidence('provider-a', 220, 0.72) }; } },
    { id: 'provider-b', priority: 20, async enrich() { calls.push('provider-b'); return { industry: evidence('provider-b', 'Manufacturing', 0.82), employee_count: evidence('provider-b', 228, 0.73) }; } },
    { id: 'provider-c', priority: 30, async enrich() { calls.push('provider-c'); return { industry: evidence('provider-c', 'Industrial', 0.9) }; } },
  ];

  const result = await enrichKnowledgeEntity({ entity: { id: 'company:acme', kind: 'company', facts: {} }, providers, requiredFields: ['industry', 'employee_count'], confidenceThreshold: 0.9, now: () => at });
  assert.deepEqual(calls, ['provider-a', 'provider-b']);
  assert.equal(result.facts.industry.value, 'Manufacturing');
  assert.ok(result.facts.industry.confidence >= 0.9);
  assert.equal(result.facts.industry.evidence.length, 2);
  assert.equal(result.facts.industry.evidence[0].source, 'provider-a');
  assert.equal(result.facts.industry.evidence[1].source, 'provider-b');
  assert.equal(result.provenance.length, 4);
});

test('waterfall records contradictions rather than silently overwriting canonical knowledge', async () => {
  const result = await enrichKnowledgeEntity({
    entity: { id: 'person:1', kind: 'person', facts: { role: evidence('crm', 'CIO', 0.92) } },
    providers: [{ id: 'external', priority: 10, async enrich() { return { role: evidence('external', 'CTO', 0.9) }; } }],
    requiredFields: ['role'], confidenceThreshold: 0.95, now: () => at,
  });
  assert.equal(result.facts.role.value, 'CIO');
  assert.equal(result.facts.role.conflicts.length, 1);
  assert.equal(result.facts.role.conflicts[0].value, 'CTO');
  assert.ok(result.facts.role.confidence < 0.92);
});

test('data health exposes coverage, freshness, conflicts and a deterministic next refresh', () => {
  const health = calculateDataHealth({
    facts: {
      industry: { value: 'Manufacturing', confidence: 0.95, observed_at: '2026-09-13T12:00:00.000Z', conflicts: [], evidence: [] },
      employee_count: { value: 220, confidence: 0.75, observed_at: '2026-07-01T12:00:00.000Z', conflicts: [{ value: 260 }], evidence: [] },
    },
    requiredFields: ['industry', 'employee_count', 'erp'], now: () => at, staleAfterDays: 30,
  });
  assert.equal(health.coverage, 2 / 3);
  assert.deepEqual(health.stale_fields, ['employee_count']);
  assert.deepEqual(health.missing_fields, ['erp']);
  assert.deepEqual(health.conflicted_fields, ['employee_count']);
  assert.match(health.next_refresh_at, /^2026-09-14T/);
  assert.ok(health.score < 1);
});

test('commercial signal detector turns knowledge changes into explainable typed signals', () => {
  const signals = detectCommercialSignals({
    entityId: 'company:acme',
    changes: [
      { field: 'executive_role', before: 'CIO: Jane', after: 'CIO: Sam', confidence: 0.94, evidence: [evidence('linkedin', 'CIO: Sam', 0.94)] },
      { field: 'job_openings_data_ai', before: 2, after: 11, confidence: 0.86, evidence: [evidence('careers', 11, 0.86)] },
      { field: 'website_intent', before: 0.2, after: 0.82, confidence: 0.9, evidence: [evidence('website', 0.82, 0.9)] },
    ],
    now: () => at,
  });
  assert.deepEqual(signals.map(s => s.type).sort(), ['hiring_spike', 'leadership_change', 'website_intent'].sort());
  assert.ok(signals.every(s => s.evidence.length > 0));
  assert.ok(signals.every(s => s.confidence > 0 && s.confidence <= 1));
});

test('opportunity scoring is explainable and produces a next best action', () => {
  const scored = scoreOpportunity({
    dimensions: { problem_fit: 0.95, role_fit: 0.9, timing: 0.88, relationship_warmth: 0.7, commercial_value: 0.85, intent: 0.92 },
    confidence: 0.87,
    evidenceRefs: ['signal:website-intent', 'signal:hiring-spike'],
  });
  assert.ok(scored.score >= 85);
  assert.equal(scored.confidence, 0.87);
  assert.equal(scored.contributions.length, 6);
  assert.ok(scored.contributions.every(c => Number.isFinite(c.points)));
  assert.equal(scored.next_best_action.type, 'personal_outreach');
  assert.ok(scored.reasons.length >= 3);
  assert.deepEqual(scored.evidence_refs, ['signal:website-intent', 'signal:hiring-spike']);
});
