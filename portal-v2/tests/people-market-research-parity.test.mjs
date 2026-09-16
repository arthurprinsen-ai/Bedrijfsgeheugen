import test from 'node:test';
import assert from 'node:assert/strict';
import { peopleMarketResearchMetrics } from '../calculators/people-market-research.js';

const state={portal:{
  profile:{employees:40,hourlyCost:50,maturity:{sturing:3,commercie:3,operatie:2,finance:3,mensen:2,analytics:3,quality:3,governance:3,tech:3,culture:2,service:3,security:3,duurzaam:2}},
  people:{absence:7.2,turnover:18,enps:-10,mto:'Verouderd',vacancies:3},
  market:{industry:'ICT & software',growth:1.2,benchmarks:[
    {metric:'Verzuim',company:7.2,benchmark:3.4,source:'CBS'},
    {metric:'Verloop',company:18,benchmark:14,source:'HR benchmark'},
    {metric:'eNPS',company:-10,benchmark:22,source:'HR benchmark'},
    {metric:'Toegevoegde waarde per FTE',company:100000,benchmark:118000,source:'CBS'}
  },
  research:{hypotheses:[{hypothesis:'X',evidence:'Y',source:'Interview',confidence:4,reviewDate:'2026-09-01'}]}
}};

test('people metrics preserve legacy benchmark gaps and replacement/onboarding load',()=>{
  const m=peopleMarketResearchMetrics(state);
  assert.equal(m.people.absenceGap,3.8);
  assert.equal(m.people.turnoverGap,4);
  assert.equal(m.people.enpsGap,-32);
  assert.equal(m.people.annualReplacements,7.2);
  assert.equal(m.people.onboardingFte,1.8);
  assert.equal(m.people.onboardingCapacityValue,144000);
  assert.equal(m.people.absenceHigh,true);
  assert.equal(m.people.turnoverHigh,false);
  assert.equal(m.people.enpsNegative,true);
});

test('MTO maturity and vacancy pressure are deterministic and use canonical people state',()=>{
  const m=peopleMarketResearchMetrics(state);
  assert.equal(m.people.mtoMaturity,1);
  assert.equal(m.people.vacancyPressure,10.2);
});

test('market benchmark deltas retain source provenance and never invent missing benchmarks',()=>{
  const m=peopleMarketResearchMetrics(state);
  const absence=m.market.benchmarkDeltas.find(x=>x.metric==='Verzuim');
  assert.deepEqual(absence,{metric:'Verzuim',company:7.2,benchmark:3.4,delta:3.8,source:'CBS'});
  assert.equal(m.market.growthContext,1.2);
  assert.equal(m.market.productivityGap,-18000);
  const empty=peopleMarketResearchMetrics({portal:{market:{benchmarks:[]}}});
  assert.equal(empty.market.productivityGap,null);
});

test('research evidence cards preserve provenance/confidence and cost of doing nothing derives from canonical capacity',()=>{
  const m=peopleMarketResearchMetrics(state);
  assert.equal(m.research.evidenceCards.length,1);
  assert.deepEqual(m.research.evidenceCards[0],{hypothesis:'X',evidence:'Y',source:'Interview',confidence:4,reviewDate:'2026-09-01'});
  assert.equal(m.research.costOfDoingNothing>0,true);
  assert.equal(m.research.maturityVsCost.averageMaturity>0,true);
});

test('missing people benchmarks fail closed rather than fabricate industry truth',()=>{
  const m=peopleMarketResearchMetrics({portal:{people:{absence:5,turnover:10,enps:5},profile:{employees:10,hourlyCost:50,maturity:{}},market:{benchmarks:[]}}});
  assert.equal(m.people.absenceGap,null);
  assert.equal(m.people.turnoverGap,null);
  assert.equal(m.people.enpsGap,null);
});
