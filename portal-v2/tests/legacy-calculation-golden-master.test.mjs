import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS, profileOverviewMetrics } from '../modules/company-input.js';

const LEGACY_WEEKLY_HOURS=Object.freeze({
  sturing:1.6,
  commercie:2.8,
  operatie:3.4,
  finance:3.6,
  mensen:1.5,
  analytics:2.2,
  quality:1.9,
  governance:1.2,
  tech:4.1,
  culture:1.1,
  service:2,
  security:2,
  duurzaam:2
});
const LEGACY_FACTOR=Object.freeze([0,1,.78,.5,.22,.06]);

function legacyMetrics({employees=24,hourlyCost=52,maturity={}}={}){
  let weeklyManualHours=0;
  let maturityTotal=0;
  for(const item of PROFILE_DIMENSIONS){
    const level=Math.max(1,Math.min(5,Math.round(Number(maturity[item.id])||1)));
    maturityTotal+=level;
    weeklyManualHours+=(LEGACY_WEEKLY_HOURS[item.id]??2)*LEGACY_FACTOR[level]*(employees/24);
  }
  const annualManualHours=weeklyManualHours*46;
  return {
    averageMaturity:maturityTotal/PROFILE_DIMENSIONS.length,
    weeklyManualHours,
    annualManualHours,
    annualManualCost:annualManualHours*hourlyCost,
    fteLost:annualManualHours/1600
  };
}

function stateFor({employees=24,hourlyCost=52,level=1}={}){
  return {portal:{profile:{
    employees,
    hourlyCost,
    maturity:Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,level]))
  }}};
}

test('V2 preserves the final 13-dimension legacy weekly-hour weights',()=>{
  const byId=Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,item.weeklyHours]));
  assert.deepEqual(byId,LEGACY_WEEKLY_HOURS);
});

test('V2 matches the legacy golden master at level 1 for the same inputs',()=>{
  const state=stateFor({employees:24,hourlyCost:52,level:1});
  const actual=profileOverviewMetrics(state);
  const expected=legacyMetrics(state.portal.profile);

  assert.equal(expected.weeklyManualHours,29.4);
  assert.equal(expected.annualManualHours,1352.4);
  assert.equal(expected.fteLost,0.84525);
  assert.equal(actual.weeklyManualHours,expected.weeklyManualHours);
  assert.equal(actual.annualManualHours,expected.annualManualHours);
  assert.equal(actual.fteLost,expected.fteLost);
  assert.equal(actual.annualManualCost,expected.annualManualCost);
  assert.equal(actual.weeksPerYear,46);
  assert.equal(actual.capacityNotCash,true);
});

test('V2 matches legacy scaling, factors and 1600-hour FTE denominator',()=>{
  const maturity=Object.fromEntries(PROFILE_DIMENSIONS.map((item,index)=>[item.id,(index%5)+1]));
  const profile={employees:48,hourlyCost:67,maturity};
  const actual=profileOverviewMetrics({portal:{profile}});
  const expected=legacyMetrics(profile);

  assert.equal(actual.averageMaturity,expected.averageMaturity);
  assert.equal(actual.weeklyManualHours,expected.weeklyManualHours);
  assert.equal(actual.annualManualHours,expected.annualManualHours);
  assert.equal(actual.fteLost,expected.fteLost);
  assert.equal(actual.annualManualCost,expected.annualManualCost);
  assert.equal(actual.fteLost,actual.annualManualHours/1600);
});
