import test from 'node:test';
import assert from 'node:assert/strict';
import { inferSkillTargetsFromIntent, selectSkillProjection } from '../scripts/brain/powerhouse-skill-projection.mjs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const entry = (fingerprint, skill_targets, date, mandatory_preflight = false) => ({
  fingerprint, skill_targets, mandatory_preflight,
  sources: ['brain/learning/' + date + '-' + fingerprint + '.json'],
  prevention: ['Reuse verified canonical knowledge'], source_digest: 'a'.repeat(64)
});
const index = { projection_digest: 'b'.repeat(64), entry_count: 4, entries: [
  entry('older-instagram', ['social'], '2026-09-01'),
  entry('newer-instagram', ['social'], '2026-10-25'),
  entry('mandatory-prevention', ['continuity'], '2026-09-02', true),
  entry('unrelated-data', ['data'], '2026-10-24')
] };

test('intent-only agents retrieve newest relevant Brain learning instead of empty domain selection', () => {
  assert.deepEqual(inferSkillTargetsFromIntent('Publiceren van een Instagram video'), ['social']);
  const result = selectSkillProjection(index, { intent: 'Publiceren van een Instagram video', maxEntries: 2 });
  assert.deepEqual(result.selected_entries.map(item => item.fingerprint), ['mandatory-prevention', 'newer-instagram']);
  assert.equal(result.matched_count, 3);
  assert.equal(result.truncated_count, 1);
  assert.equal(result.projection_digest, index.projection_digest);
});

test('exact fingerprints and mandatory rules are not lost under a bounded intent budget', () => {
  const result = selectSkillProjection(index, { intent: 'Instagram post publiceren', fingerprints: ['older-instagram'], maxEntries: 1 });
  assert.deepEqual(result.selected_entries.map(item => item.fingerprint), ['mandatory-prevention', 'older-instagram']);
  assert.equal(result.truncated_count, 1);
});

test('unrecognized intent retains mandatory prevention and does not dump all history', () => {
  for (const intent of ['', 'Pianoles op zaterdag']) {
    const result = selectSkillProjection(index, { intent, maxEntries: 2 });
    assert.deepEqual(result.selected_entries.map(item => item.fingerprint), ['mandatory-prevention']);
  }
});

test('innovation and knowledge preservation are both visible to subsequent agents', () => {
  const targets = inferSkillTargetsFromIntent('Borg skills en agents, documentatie en innovaties');
  assert.ok(targets.includes('continuity'));
  assert.ok(targets.includes('foresight'));
});

test('real canonical preflight records selected source-backed learning and a digest', () => {
  const packet = compileChatLearningPreflight({
    executionContext: { intent: 'Instagram video publiceren', deliveryLanes: [] }
  });
  const selection = packet.skill_projection.selection;
  assert.ok(selection.inferred_targets.includes('social'));
  assert.equal(selection.projection_digest, packet.skill_projection.projection_digest);
  assert.ok(selection.selected_entries.some(item => item.skill_targets.includes('social')));
  assert.ok(selection.matched_count >= selection.selected_entries.length);
  assert.ok(selection.truncated_count >= 0);
});
