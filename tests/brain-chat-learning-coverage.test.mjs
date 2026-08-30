import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('docs/brain/chat-learning/2026-08-30.json', 'utf8'));
const lessons = JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json', 'utf8'));
const rules = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json', 'utf8'));

const lessonByFingerprint = new Map((lessons.lessons || []).map((item) => [item.fingerprint, item]));
const ruleById = new Map((rules.rules || []).map((item) => [item.id, item]));

test('2026-08-30 chat learning index is a non-authoritative coverage index over canonical Brain sources', () => {
  assert.equal(manifest.role, 'COVERAGE_INDEX_ONLY');
  assert.equal(manifest.executableTruth, 'GitHub main');
  assert.equal(manifest.learningTruth, 'docs/brain/delivery-failure-lessons.json');
  assert.equal(manifest.preventionTruth, 'config/delivery-prevention-rules.json');
  assert.equal(manifest.brainContract, 'BRAIN-DELIVERY-v2 + brain.v1');
});

test('every required chat failure fingerprint remains PROVEN and backed by an active prevention rule', () => {
  assert.ok(manifest.requiredFailureFingerprints.length >= 15);
  for (const fingerprint of manifest.requiredFailureFingerprints) {
    const lesson = lessonByFingerprint.get(fingerprint);
    assert.ok(lesson, `missing required chat lesson: ${fingerprint}`);
    assert.equal(lesson.status, 'PROVEN', `${fingerprint} must remain PROVEN`);
    assert.ok(lesson.preventionRule, `${fingerprint} must reference a prevention rule`);
    const rule = ruleById.get(lesson.preventionRule);
    assert.ok(rule, `missing prevention rule ${lesson.preventionRule} for ${fingerprint}`);
    assert.equal(rule.active, true, `prevention ${lesson.preventionRule} must remain active`);
  }
});

test('chat architecture invariants preserve one executable truth and fail-closed production evidence', () => {
  assert.deepEqual(manifest.architectureInvariants, {
    githubExecutableSSOT: true,
    notionReadModelOnly: true,
    brainSharedLearningMemory: true,
    exactShaPromotionRequired: true,
    persistentEvidenceBeforeGreen: true,
    movingMainConflictAware: true,
    duplicateCandidateConsolidationRequired: true,
    externalPlatformControlsFailClosed: true,
    outcomeEvidenceBeforeGreen: true,
    tddCandidateBranchOnly: true,
  });
});

test('coverage index contains no secrets, credentials or webhook values', () => {
  const serialized = JSON.stringify(manifest).toLowerCase();
  for (const forbidden of ['password', 'secret_value', 'access_token', 'authorization:', 'webhook_url']) {
    assert.equal(serialized.includes(forbidden), false, `coverage index must not contain ${forbidden}`);
  }
});
