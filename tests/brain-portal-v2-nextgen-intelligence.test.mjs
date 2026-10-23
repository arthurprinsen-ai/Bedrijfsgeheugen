import test from 'node:test';
import assert from 'node:assert/strict';
import { project, confidence } from '../portal-v2/nextgen-intelligence.js';

// Synthetic fixture for contract testing only: never a customer or production forecast.
const metricWithVerifiedReceipt = (forecastOverrides={}, metricOverrides={}) => ({
  value: 62,
  delta: -3,
  label: 'Kennisborging',
  tenantId: 'test-tenant-a',
  metricKey: 'knowledge_health',
  canonicalForecast: {
    status: 'VERIFIED',
    origin: 'authenticated_portal_forecast',
    tenantId: 'test-tenant-a',
    metricKey: 'knowledge_health',
    modelVersion: 'synthetic-contract-test-v1',
    sourceRefs: ['unit-test://independent-source-receipt'],
    backtest: {status: 'PASS'},
    independentReview: {approved: true},
    currentValue: 62,
    expected: 54,
    lower: 48,
    upper: 60,
    horizonMonths: 6,
    calibratedConfidence: 82,
    verifiedAt: new Date().toISOString(),
    sourceUpdatedAt: new Date().toISOString(),
    ...forecastOverrides,
  },
  ...metricOverrides,
});

test('unverified KPI text never becomes a future projection or invented scenario ordering',()=>{
  const metric={value:70,delta:2,label:'Bedrijfsgezondheid'};
  for(const scenario of ['stress','base','opportunity']){
    assert.equal(project(metric,6,scenario),null,scenario);
    assert.equal(project({value:98,delta:8,label:'Test'},12,scenario),null,scenario);
  }
  assert.equal(confidence(metric),null);
});

test('verified tenant-bound, backtested base forecast can be displayed with exact evidence bounds',()=>{
  const metric=metricWithVerifiedReceipt();
  assert.deepEqual(project(metric,6,'base'),{
    current:62,projected:54,change:-8,lower:48,upper:60,
    sourceRefs:['unit-test://independent-source-receipt'],
  });
  assert.equal(confidence(metric),82);
});

test('scenario and horizon changes fail closed without separately verified receipts',()=>{
  const metric=metricWithVerifiedReceipt();
  for(const scenario of ['stress','opportunity']){
    assert.equal(project(metric,6,scenario),null,scenario);
  }
  assert.equal(project(metric,12,'base'),null);
  assert.equal(project(metric,3,'base'),null);
  assert.equal(project(metricWithVerifiedReceipt({expected:48,lower:42,upper:54}),6,'base')?.projected,48);
});

test('cross-tenant, unverifiable, stale or unreviewed forecast evidence is rejected',()=>{
  const stale=new Date(Date.now()-31*86400000).toISOString();
  const invalid=[
    metricWithVerifiedReceipt({status:'CANDIDATE'}),
    metricWithVerifiedReceipt({origin:'visual_kpi'}),
    metricWithVerifiedReceipt({tenantId:'other-tenant'}),
    metricWithVerifiedReceipt({metricKey:'other-metric'}),
    metricWithVerifiedReceipt({sourceRefs:[]}),
    metricWithVerifiedReceipt({sourceRefs:['']}),
    metricWithVerifiedReceipt({modelVersion:''}),
    metricWithVerifiedReceipt({backtest:{status:'FAIL'}}),
    metricWithVerifiedReceipt({independentReview:{approved:false}}),
    metricWithVerifiedReceipt({verifiedAt:stale}),
    metricWithVerifiedReceipt({sourceUpdatedAt:stale}),
    metricWithVerifiedReceipt({expected:61}),
    metricWithVerifiedReceipt({calibratedConfidence:101}),
    metricWithVerifiedReceipt({calibratedConfidence:-1}),
    metricWithVerifiedReceipt({}, {tenantId:'other-tenant'}),
    metricWithVerifiedReceipt({}, {metricKey:'other-metric'}),
  ];
  for(const [index,metric] of invalid.entries()){
    assert.equal(project(metric,6,'base'),null,`invalid evidence case ${index} must not project`);
  }
  assert.equal(confidence(metricWithVerifiedReceipt({calibratedConfidence:101})),null);
  assert.equal(confidence({value:70,delta:2}),null);
});
