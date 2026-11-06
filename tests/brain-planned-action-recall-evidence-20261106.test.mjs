import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlannedActionEvidence, appendPlannedActionEvidence, evaluatePlannedActionRecall, REVIEW_CONTRACT } from '../brain/observability/planned-action-recall.mjs';

const now = '2026-11-06T22:00:00.000Z';
const key = 'test-only-hmac-key-not-a-provider-token-0123456789';
const action = (executionId, ruleIds, blocked = ruleIds) => buildPlannedActionEvidence({
  tenantId: 'canonical', action: 'Real agent plans to update workflow permission ' + executionId,
  result: {
    ok: blocked.length === 0,
    matches: ruleIds.map(ruleId => ({ ruleId })),
    unacknowledged: blocked.map(ruleId => ({ ruleId })),
  },
  agentId: executionId.startsWith('run-a') ? 'agent-alpha' : 'agent-beta',
  sourceRef: 'github:run:42298881819', executionId, hmacKey: key, observedAt: now,
}).record;
const review = (decision, expectedRuleIds, reviewerId = 'reviewer-independent') => ({
  schemaVersion: 'brain-record.v1', tenantId: 'canonical',
  type: 'Verification', kind: 'verification', id: 'review:' + decision.id,
  subjectId: decision.subjectId, observedAt: '2026-11-06T22:01:00.000Z',
  status: 'REVIEWED', verified: true,
  payload: {
    contract: REVIEW_CONTRACT, decisionRecordId: decision.id,
    reviewerId, independent: true, expectedRuleIds,
    evidenceRef: 'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5511',
  },
});

test('privacy-first evidence contains no raw action, token or original text', () => {
  const built = buildPlannedActionEvidence({
    tenantId: 'canonical', action: 'my secret PRIVATE_VALUE do not persist',
    result: { ok: false, matches: [{ ruleId: 'RISK_ONE' }], unacknowledged: [{ ruleId: 'RISK_ONE' }] },
    agentId: 'agent-alpha', sourceRef: 'github:pr:5511', executionId: 'run-a-one', hmacKey: key, observedAt: now,
  });
  assert.equal(built.record.payload.sourceKind, 'REAL_AGENT_PREFLIGHT');
  assert.equal(built.record.payload.actionHmacSha256.length, 64);
  assert.equal(built.record.verified, false);
  assert.equal(built.record.executed, false);
  assert.ok(!JSON.stringify(built.record).includes('PRIVATE_VALUE'));
  assert.ok(!JSON.stringify(built.record).includes('my secret'));
  assert.ok(!JSON.stringify(built.record).includes(key));
  assert.equal(built.idempotencyKey, 'planned-action-decision:canonical:run-a-one');
});

test('only existing canonical BRAIN adapter may append an observation', async () => {
  const prepared = buildPlannedActionEvidence({
    tenantId:'canonical',action:'fix a github workflow permission',agentId:'agent-alpha',
    sourceRef:'github:pr:5511',executionId:'run-a-two',hmacKey:key,observedAt:now,
    result:{ok:false,matches:[{ruleId:'RISK_ONE'}],unacknowledged:[{ruleId:'RISK_ONE'}]},
  });
  const writes = [];
  const adapter = { async appendRecord(record,options) { writes.push({record,options}); return {record}; } };
  await appendPlannedActionEvidence(adapter,prepared,'sha-main');
  assert.equal(writes.length,1);
  assert.equal(writes[0].record.type,'Evidence');
  assert.equal(writes[0].options.sourceRevision,'sha-main');
  assert.throws(() => buildPlannedActionEvidence({
    tenantId:'canonical',action:'action',agentId:'agent-alpha',sourceRef:'http://evil',executionId:'run-a-one',hmacKey:key,observedAt:now,
    result:{ok:true,matches:[],unacknowledged:[]},
  }), /GitHub source ref/);
});

test('no genuine independently reviewed action means NOT_MEASURED, not zero or 100 percent', () => {
  const noEvidence = evaluatePlannedActionRecall([], {from:'2026-11-06T00:00:00Z',to:'2026-11-07T00:00:00Z'});
  assert.equal(noEvidence.verdict,'NOT_MEASURED');
  assert.deepEqual(noEvidence.metrics,{recall:null,precision:null,falseBlockRate:null});
  const one = action('run-a-one',['RISK_ONE']);
  assert.equal(evaluatePlannedActionRecall([one]).verdict,'NOT_MEASURED');
  const fakeReview={...review(one,['RISK_ONE']),verified:false};
  assert.equal(evaluatePlannedActionRecall([one,fakeReview]).verdict,'NOT_MEASURED');
});

test('review must be independent, verified, source-grounded and tenant-matched', () => {
  const one=action('run-a-one',['RISK_ONE']);
  const sameAgent=review(one,['RISK_ONE'],'agent-alpha');
  assert.equal(evaluatePlannedActionRecall([one,sameAgent]).verdict,'NOT_MEASURED');
  const wrongTenant={...review(one,['RISK_ONE']),tenantId:'other-tenant'};
  assert.equal(evaluatePlannedActionRecall([one,wrongTenant]).verdict,'NOT_MEASURED');
  const noEvidence={...review(one,['RISK_ONE']),payload:{...review(one,['RISK_ONE']).payload,evidenceRef:''}};
  assert.equal(evaluatePlannedActionRecall([one,noEvidence]).verdict,'NOT_MEASURED');
});

test('small real observations remain INSUFFICIENT_EVIDENCE with no numeric percentages', () => {
  const positive=action('run-a-one',['RISK_ONE']);
  const negative=action('run-b-one',[]);
  const result=evaluatePlannedActionRecall([positive,review(positive,['RISK_ONE']),negative,review(negative,[])]);
  assert.equal(result.verdict,'INSUFFICIENT_EVIDENCE');
  assert.equal(result.sample.reviewed,2);
  assert.equal(result.sample.agents,2);
  assert.equal(result.sample.positive,1);
  assert.equal(result.sample.negative,1);
  assert.equal(result.metrics.recall,null);
  assert.equal(result.metrics.falseBlockRate,null);
});

test('only sufficiently independently reviewed representative input enables actual metrics', () => {
  const data=[];
  for(let i=0;i<40;i++){
    const positive=i<20;
    const exec=(i%2===0?'run-a-':'run-b-')+i;
    const actual=positive
      ? (i===0 ? [] : ['RISK_ONE']) // one miss: false negative
      : (i===20 ? ['RISK_ONE'] : []); // one wrong block: false positive
    const decision=action(exec,actual);
    data.push(decision,review(decision,positive?['RISK_ONE']:[]));
  }
  const result=evaluatePlannedActionRecall(data);
  assert.equal(result.verdict,'MEASURED');
  assert.equal(result.sample.reviewed,40);
  assert.equal(result.sample.agents,2);
  assert.deepEqual(result.confusion,{tp:19,fp:1,fn:1,falseBlocks:1,safe:20});
  assert.equal(result.metrics.recall,19/20);
  assert.equal(result.metrics.precision,19/20);
  assert.equal(result.metrics.falseBlockRate,1/20);
  assert.equal(result.causalPrevention,'NOT_PROVEN');
});

test('duplicate decisions, duplicate review records and out-of-window samples cannot inflate denominator', () => {
  const a=action('run-a-one',['RISK_ONE']);
  const b=action('run-b-one',['RISK_ONE']);
  const conflict=evaluatePlannedActionRecall([a,a,review(a,['RISK_ONE'])]);
  assert.equal(conflict.verdict,'NOT_MEASURED');
  const duplicateReviews=evaluatePlannedActionRecall([b,review(b,['RISK_ONE']),{...review(b,['RISK_ONE']),id:'review:second'}]);
  assert.equal(duplicateReviews.verdict,'NOT_MEASURED');
  const outside=evaluatePlannedActionRecall([a,review(a,['RISK_ONE'])],{from:'2026-11-07T00:00:00Z'});
  assert.equal(outside.verdict,'NOT_MEASURED');
});
