import test from 'node:test';
import assert from 'node:assert/strict';
import {project,confidence} from '../portal-v2/nextgen-intelligence.js';

test('historical replay: visible KPI digits cannot become a future or trust claim',()=>{
  const  legacyExamples=[
    {value:70,delta:2,label:'Omzet'},
    {value:98,delta:8,label:'Tijdwinst'},
    {value:64,delta:3,label:'Proces'},
    {value:0,delta:-4,label:'Risico'}
  ];
  for(const signal of legacyExamples){
    for(const horizon of [3,6,12]){
      assert.equal(project(signal,horizon,'base'),null);
      assert.equal(project(signal,horizon,'stress'),null);
      assert.equal(project(signal,horizon,'opportunity'),null);
    }
    assert.equal(confidence(signal),null);
  }
});
test('historical replay: unproven verified flag without tenant/source/backtest is not a forecast',()=>{
  const metric={value:70,canonicalForecast:{status:'VERIFIED',expected:95,
    origin:'authenticated_portal_forecast',horizonMonths:6}};
  assert.equal(project(metric,6,'base'),null);
  assert.equal(confidence(metric),null);
});
