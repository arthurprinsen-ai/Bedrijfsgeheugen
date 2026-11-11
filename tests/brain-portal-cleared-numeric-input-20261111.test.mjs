import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFieldValue } from '../portal-v2/form-primitives.js';
import { impactForMutation } from '../portal-v2/portal-impact-engine.js';
import { profileOverviewMetrics, PROFILE_DIMENSIONS } from '../portal-v2/modules/company-input.js';

test('blank numeric customer input is missing and explicit 0 remains a fact',()=>{
 for(const type of ['number','currency','percentage','range']){
  assert.equal(normalizeFieldValue({type,min:1,max:5},''),null);
  assert.equal(normalizeFieldValue({type,min:1,max:5},null),null);
  assert.equal(normalizeFieldValue({type,min:1,max:5},'not-a-number'),null);
 }
 assert.equal(normalizeFieldValue({type:'number'},'0'),0);
 assert.equal(normalizeFieldValue({type:'currency'},'0'),0);
});

test('cleared customer hourly cost withdraws derived annual value and remains a causal change',()=>{
 const maturity=Object.fromEntries(PROFILE_DIMENSIONS.map(x=>[x.id,2]));
 const before={portal:{profile:{employees:24,hourlyCost:50,maturity}}};
 const after=structuredClone(before);
 after.portal.profile.hourlyCost=normalizeFieldValue({type:'currency'},'');
 assert.ok(profileOverviewMetrics(before).annualManualCost>0);
 assert.equal(profileOverviewMetrics(after).annualManualCost,null);
 assert.equal(profileOverviewMetrics(after).evidenceStatus,'INCOMPLETE_CUSTOMER_INPUTS');
 const effect=impactForMutation({path:'portal.profile.hourlyCost',before,after});
 assert.equal(effect.changed,true);
 assert.ok(effect.affectedPages.includes('businesscase'));
 assert.ok(effect.affectedPages.includes('advies'));
 assert.equal(effect.externalExecutionAuthorized,false);
});

test('explicit zero cleared to unknown cannot be silently conflated in impact lineage',()=>{
 const impact=impactForMutation({
  path:'portal.metrics.revenue',
  before:{portal:{metrics:{revenue:0}}},
  after:{portal:{metrics:{revenue:null}}}
 });
 assert.equal(impact.changed,true);
 assert.equal(impact.mappingStatus,'MAPPED');
 assert.ok(impact.affectedPages.includes('cijfers-maatstaven'));
 for(const change of impact.changes)if(change.to===null)assert.equal(change.delta,null);
});
