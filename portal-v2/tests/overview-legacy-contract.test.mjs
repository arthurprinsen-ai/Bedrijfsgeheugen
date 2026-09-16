import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS, profileOverviewMetrics } from '../modules/company-input.js';
import { calculateCapability } from '../legacy-parity-engine.js';
import { PAGE_NAVIGATION } from '../native-pages.js';
import { pageVisual } from '../page-visuals.js';

const state={portal:{
  profile:{employees:48,hourlyCost:67,maturity:Object.fromEntries(PROFILE_DIMENSIONS.map((item,index)=>[item.id,(index%5)+1]))},
  overview:{blockers:[{name:'Handmatige overdracht',impact:4,urgency:5},{name:'Dubbele invoer',impact:3,urgency:2}]},
  roadmap:{items:[{title:'A',progress:50},{title:'B',done:true}]},
  advice:{items:[{title:'A',priority:4,value:12000,duration:4},{title:'B',priority:2,value:5000,duration:2}]}
}};

test('Overview legacy calculations use the same canonical V2 profile authority as the visible KPI cards',()=>{
  const view=profileOverviewMetrics(state);
  const calc=calculateCapability('overzicht',state);
  assert.equal(calc['average-maturity'],view.averageMaturity);
  assert.equal(calc['manual-work-annual'],view.annualManualCost);
  assert.equal(calc['fte-lost'],view.fteLost);
  assert.equal(calc['dimension-cost-total'],view.annualManualCost);
  assert.ok(calc['dimension-potential-total']>=0);
  assert.ok(calc['biggest-cost-dimension']?.id);
});

test('Overview preserves the three legacy navigation actions',()=>{
  const [,actions]=PAGE_NAVIGATION.overzicht;
  assert.deepEqual(actions.map(([,pageId])=>pageId),['businesscase','profiel','advies']);
});

test('Overview renders all five legacy model families instead of only the redesign subset',()=>{
  const visual=pageVisual('overzicht',state);
  for(const label of ['CMMI','Adoptiecurve','capaciteit weglekt','Blokkades','Voortgang']){
    assert.match(visual,new RegExp(label,'i'),`${label} ontbreekt in Overview visual parity`);
  }
});
