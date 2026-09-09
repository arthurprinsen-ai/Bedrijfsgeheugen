import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS, profileOverviewMetrics, companyInputSchema } from '../modules/company-input.js';

test('profile restores all 13 protected legacy maturity dimensions plus employees and hourly cost',()=>{
  assert.equal(PROFILE_DIMENSIONS.length,13);
  assert.deepEqual(PROFILE_DIMENSIONS.map(item=>item.id),['sturing','commercie','operatie','finance','mensen','analytics','quality','governance','tech','culture','service','security','duurzaam']);
  const schema=companyInputSchema('profiel');
  assert.ok(schema.some(field=>field.legacyFieldId==='mw'));
  assert.ok(schema.some(field=>field.legacyFieldId==='uur'));
  for(const dimension of PROFILE_DIMENSIONS) assert.ok(schema.some(field=>field.legacyFieldId===`s-${dimension.id}`));
});

test('overview calculations preserve the legacy 46-week annualization and capacity semantics',()=>{
  const state={portal:{profile:{employees:24,hourlyCost:52,maturity:Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,1]))}}};
  const metrics=profileOverviewMetrics(state);
  assert.equal(metrics.averageMaturity,1);
  assert.equal(metrics.annualManualHours,PROFILE_DIMENSIONS.reduce((sum,item)=>sum+item.weeklyHours,0)*46);
  assert.equal(metrics.annualManualCost,metrics.annualManualHours*52);
  assert.equal(metrics.fteLost,metrics.annualManualHours/1600);
  assert.equal(metrics.weeksPerYear,46);
  assert.equal(metrics.capacityNotCash,true);
});

test('raising maturity reduces derived manual work',()=>{
  const low={portal:{profile:{employees:24,hourlyCost:52,maturity:Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,1]))}}};
  const high={portal:{profile:{employees:24,hourlyCost:52,maturity:Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,4]))}}};
  assert.ok(profileOverviewMetrics(high).annualManualHours < profileOverviewMetrics(low).annualManualHours);
});
