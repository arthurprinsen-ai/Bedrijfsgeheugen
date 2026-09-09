import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRuleSnapshot } from '../lib/content-learning/rule-snapshot.mjs';

test('builds a bounded snapshot from active Brain rules and keeps low-evidence items informational', () => {
  const snapshot = buildRuleSnapshot([
    { regel_id:'slotvraag', onderwerp:'Slotvraag', regel:'Vraag om een concreet voorbeeld.', vertrouwen:0.85, status:'actief', bijgewerkt_op:'2026-09-09T18:10:20Z' },
    { regel_id:'haaktype', onderwerp:'Haaktype', regel:'Nog te weinig bewijs.', vertrouwen:0, status:'te weinig bewijs', bijgewerkt_op:'2026-09-09T18:10:20Z' }
  ], { now:new Date('2026-09-09T19:00:00Z'), maxAgeHours:96 });
  assert.match(snapshot.snapshot_id, /^brain-rules:/);
  assert.equal(snapshot.positive_rules.length, 1);
  assert.equal(snapshot.positive_rules[0].id, 'slotvraag');
  assert.equal(snapshot.evidence_gaps.length, 1);
  assert.equal(snapshot.evidence_gaps[0].id, 'haaktype');
  assert.ok(snapshot.expires_at);
});

test('fails closed when there is no active rule', () => {
  assert.throws(() => buildRuleSnapshot([{ regel_id:'x', regel:'geen bewijs', status:'te weinig bewijs', bijgewerkt_op:'2026-09-09T18:10:20Z' }]), /CONTENT_RULE_CONTEXT_UNAVAILABLE/);
});

test('fails closed when active rules are stale', () => {
  assert.throws(() => buildRuleSnapshot([{ regel_id:'x', regel:'regel', status:'actief', vertrouwen:0.8, bijgewerkt_op:'2026-08-01T00:00:00Z' }], { now:new Date('2026-09-09T19:00:00Z'), maxAgeHours:96 }), /CONTENT_RULE_CONTEXT_STALE/);
});
