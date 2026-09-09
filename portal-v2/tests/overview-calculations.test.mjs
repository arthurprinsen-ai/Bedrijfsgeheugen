import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DIMENSIONS } from '../modules/company-input.js';
import { overviewViewModel } from '../modules/overview.js';

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
