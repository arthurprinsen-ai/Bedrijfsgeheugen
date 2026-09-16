import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS } from '../modules/company-input.js';
import { overviewViewModel } from '../modules/overview.js';
import { calculateLegacyEquivalent } from '../legacy-parity-engine.js';
import { overviewCapabilitySnapshot } from '../legacy-parity.js';

test('overview stays in preview mode without persisted customer profile data',()=>{
  assert.equal(overviewViewModel({}),null);
});

test('overview derives customer KPI cards from the canonical profile state',()=>{
  const state={portal:{profile:{employees:24,hourlyCost:52,maturity:Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,2]))}}};
  const view=overviewViewModel(state);
  assert.equal(view.weeksPerYear,46);
  assert.equal(view.capacityNotCash,true);
  assert.equal(view.cards.length,4);
  assert.equal(view.cards[0].label,'Gemiddelde volwassenheid');
  assert.match(view.cards[1].value,/uur/);
  assert.match(view.cards[2].value,/fte/);
  assert.match(view.cards[3].note,/geen cashbesparing/i);
});

test('legacy Overview models consume the same canonical portal.profile.maturity state as native V2',()=>{
  const maturity=Object.fromEntries(PROFILE_DIMENSIONS.map((item,index)=>[item.id,(index%5)+1]));
  const state={portal:{profile:{employees:24,hourlyCost:52,maturity}}};
  const native=overviewViewModel(state);
  const expectedAverage=PROFILE_DIMENSIONS.reduce((sum,item)=>sum+maturity[item.id],0)/PROFILE_DIMENSIONS.length;

  assert.equal(calculateLegacyEquivalent('average-maturity',state),expectedAverage);
  assert.equal(calculateLegacyEquivalent('cmmi-level',state),Math.round(expectedAverage));
  assert.equal(calculateLegacyEquivalent('company-state',state),expectedAverage>=3?'op koers':'kwetsbaar');
  assert.equal(native.cards[0].value,`${new Intl.NumberFormat('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1}).format(expectedAverage)}/5`);
});

test('legacy Overview core set renders customer-derived values instead of static demo numbers',()=>{
  const maturity=Object.fromEntries(PROFILE_DIMENSIONS.map(item=>[item.id,4]));
  const state={portal:{
    profile:{employees:24,hourlyCost:52,maturity},
    overview:{blockers:[{title:'ERP overdracht',impact:4,urgency:5}]},
    roadmap:{items:[{title:'A',progress:25},{title:'B',progress:75}]},
    advice:{items:[{title:'Automatiseer overdracht',priority:4,value:8000,duration:4}]},
    dataAi:{phase:'Pilot'}
  }};
  const snapshot=overviewCapabilitySnapshot(state);
  const values=Object.fromEntries(snapshot.map(item=>[item.id,item.value]));

  assert.equal(snapshot.length,10);
  assert.match(values.maturity,/4,0 \/ 5/);
  assert.match(values['manual-work-annual'],/uur/);
  assert.match(values.fte,/FTE/i);
  assert.equal(values['company-state'],'Voorsprong');
  assert.match(values.cmmi,/Niveau 4/);
  assert.equal(values['adoption-curve'],'Pilot');
  assert.equal(values.blockers,'1');
  assert.equal(values.progress,'50%');
  assert.equal(values.advice,'Automatiseer overdracht');
  assert.doesNotMatch(snapshot.map(item=>item.value).join('|'),/6\.720|3,7 FTE|68%|Borg Finance-kennis/);
});
