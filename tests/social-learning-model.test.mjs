import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMetricSnapshot,
  metricVector,
  selectEvaluationWindow,
  evaluateLearningCandidate,
  transitionLearningState,
  chooseDecisionMode,
} from '../netlify/functions/_social-learning-model.mjs';

const config = {
  windowsHours: [24, 48, 72],
  promotion: { minSampleSize: 5, minPublicationDates: 2, minConfidence: 0.75 },
  explorationTarget: 0.2,
  metricPriority: ['revenue','orders','offers','qualified_leads','meetings','dms','substantive_interactions','clicks','likes'],
};

test('missing metrics remain null while explicit zero remains zero', () => {
  const snapshot = normalizeMetricSnapshot({ impressions: 100, likes: 0 });
  assert.equal(snapshot.likes, 0);
  assert.equal(snapshot.comments, null);
});

test('evaluation window resolves deterministically to 24/48/72 hours', () => {
  const publishedAt = '2026-09-01T10:00:00.000Z';
  assert.equal(selectEvaluationWindow({ publishedAt, observedAt: '2026-09-02T10:05:00.000Z', windows: config.windowsHours }), 24);
  assert.equal(selectEvaluationWindow({ publishedAt, observedAt: '2026-09-03T10:05:00.000Z', windows: config.windowsHours }), 48);
  assert.equal(selectEvaluationWindow({ publishedAt, observedAt: '2026-09-04T10:05:00.000Z', windows: config.windowsHours }), 72);
});

test('metric vector normalizes interactions by exposure', () => {
  const vector = metricVector(normalizeMetricSnapshot({ impressions: 200, comments: 10, shares: 4, saves: 6, likes: 50 }));
  assert.equal(vector.comment_rate, 0.05);
  assert.equal(vector.substantive_interaction_rate, 0.1);
});

test('higher-priority contradictory commercial outcome blocks promotion', () => {
  const result = evaluateLearningCandidate({ sampleSize: 8, publicationDates: ['2026-09-01','2026-09-02'], confidence: 0.9, effectSize: 0.4, directionConsistent: true, higherPriorityContradiction: true }, config);
  assert.equal(result.promotable, false);
});

test('candidate becomes proven only after conservative thresholds', () => {
  const evidence = { sampleSize: 6, publicationDates: ['2026-09-01','2026-09-02'], confidence: 0.81, effectSize: 0.25, directionConsistent: true, higherPriorityContradiction: false };
  assert.equal(transitionLearningState('TESTING', evidence, config), 'PROVEN');
});

test('proven learning weakens when confidence drops materially', () => {
  const evidence = { sampleSize: 8, publicationDates: ['2026-09-01','2026-09-02'], confidence: 0.49, effectSize: 0.02, directionConsistent: false, higherPriorityContradiction: false };
  assert.equal(transitionLearningState('PROVEN', evidence, config), 'WEAKENING');
});

test('rolling exploration target chooses exploration when under target', () => {
  assert.equal(chooseDecisionMode(['EXPLOIT','EXPLOIT','EXPLOIT','EXPLOIT'], config), 'EXPLORE');
  assert.equal(chooseDecisionMode(['EXPLORE','EXPLOIT','EXPLOIT','EXPLOIT','EXPLOIT'], config), 'EXPLOIT');
});
