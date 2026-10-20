import test from 'node:test';
import assert from 'node:assert/strict';
import {project,confidence,semanticLabel} from '../nextgen-intelligence.js';

const proven=()=>({
  value:70,label:'Proces',tenantId:'tenant-fixture',metricKey:'process-health',canonicalForecast:{
    status:'VERIFIED',origin:'authenticated_portal_forecast',tenantId:'tenant-fixture',
    metricKey:'process-health',modelVersion:'verified-model-fixture',sourceRefs:['test-evidence-ref'],
    backtest:{status:'PASS'},independentReview:{approved:true},verifiedAt:new Date().toISOString(),sourceUpdatedAt:new Date().toISOString(),currentValue:70,
    horizonMonths:6,expected:78,lower:75,upper:81,calibratedConfidence:81
  }
});

test('visible KPI numbers and deltas do not invent forecasts, forecast bands or confidence',()=>{
  for(const metric of [{value:70,delta:2,label:'Proces'},{value:64,delta:3},{value:98,delta:8}]){
    assert.equal(project(metric,6,'base'),null);
    assert.equal(project(metric,12,'opportunity'),null);
    assert.equal(confidence(metric),null);
  }
});
test('canonical tenant verified and backtested forecast can be read, never scenario-scaled',()=>{
  const metric=proven();
  assert.deepEqual(project(metric,6,'base'),{current:70,projected:78,change:8,lower:75,upper:81,sourceRefs:['test-evidence-ref']});
  assert.equal(confidence(metric),81);
  assert.equal(project(metric,6,'stress'),null);
  assert.equal(project(metric,12,'base'),null);
});
test('missing, outdated, cross-origin, unbacktested and invalid bounds fail closed',()=>{
  for(const change of [
    {sourceRefs:[]},{tenantId:''},{metricKey:'wrong-metric'},{origin:'dom_text'},{backtest:{status:'UNKNOWN'}},{independentReview:{approved:false}},
    {verifiedAt:'2020-01-01T00:00:00Z'},{sourceUpdatedAt:'2020-01-01T00:00:00Z'},{lower:82,upper:84},{expected:null},{calibratedConfidence:110}
  ]){
    const metric=proven();Object.assign(metric.canonicalForecast,change);
    assert.equal(project(metric,6,'base'),null);
  }
});
test('semantic chart labels preserve explicit meaning, not a synthetic business claim',()=>{
  assert.equal(semanticLabel({title:'Omzet: € 240.000',aria:'fallback'}),'Omzet: € 240.000');
  assert.equal(semanticLabel({aria:'Risico hoog'}),'Risico hoog');
  assert.ok(semanticLabel({text:'x'.repeat(400)}).length<=180);
});
