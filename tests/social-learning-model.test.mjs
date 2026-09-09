import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMetricSnapshot,
  metricVector,
  selectEvaluationWindow,
  selectSnapshotForWindow,
  selectOptimizationMetric,
  evaluateLearningCandidate,
  transitionLearningState,
  chooseDecisionMode,
} from '../netlify/functions/_social-learning-model.mjs';

const config = {
  windowsHours: [24, 48, 72],
  windowToleranceHours: 6,
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

test('window evaluation chooses only a snapshot close to the requested age', () => {
  const publishedAt='2026-09-01T10:00:00Z';
  const snapshots=[
    {snapshotId:'s25',observedAt:'2026-09-02T11:00:00Z'},
    {snapshotId:'s72',observedAt:'2026-09-04T10:00:00Z'}
  ];
  assert.equal(selectSnapshotForWindow({snapshots,publishedAt,windowHours:24,toleranceHours:6}).snapshotId,'s25');
  assert.equal(selectSnapshotForWindow({snapshots,publishedAt,windowHours:48,toleranceHours:6}),null);
});

test('metric vector normalizes interactions and commercial outcomes by exposure', () => {
  const vector = metricVector(normalizeMetricSnapshot({ impressions: 200, comments: 10, shares: 4, saves: 6, likes: 50, qualified_leads:2, orders:1, revenue:1000 }));
  assert.equal(vector.comment_rate, 0.05);
  assert.equal(vector.substantive_interaction_rate, 0.1);
  assert.equal(vector.qualified_lead_rate,0.01);
  assert.equal(vector.order_rate,0.005);
  assert.equal(vector.revenue_per_impression,5);
});

test('optimization chooses highest-value available metric and detects higher-priority contradiction',()=>{
  const target=metricVector({impressions:100,revenue:50,orders:0,comments:20,shares:5,saves:5});
  const cohort=[metricVector({impressions:100,revenue:100,orders:1,comments:5,shares:1,saves:1})];
  const selected=selectOptimizationMetric(target,cohort,config.metricPriority);
  assert.equal(selected.metric,'revenue');
  assert.equal(selected.effectSize,-0.5);
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
