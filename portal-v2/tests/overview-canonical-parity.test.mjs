import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { overviewViewModel } from '../modules/overview.js';

const legacySource=fs.readFileSync(new URL('../legacy-parity.js',import.meta.url),'utf8');

const maturity=level=>Object.fromEntries(['sturing','commercie','operatie','finance','mensen','analytics','quality','governance','tech','culture','service','security','duurzaam'].map(id=>[id,level]));

test('legacy parity layer contains no hardcoded customer business values',()=>{
  for(const forbidden of ['3,4 / 5','6.720 uur','3,7 FTE','11%','68%']){
    assert.equal(legacySource.includes(forbidden),false,`hardcoded overview truth remains: ${forbidden}`);
  }
});

test('overview values change when canonical Powerhouse profile state changes',()=>{
  const low=overviewViewModel({portal:{profile:{employees:24,hourlyCost:50,maturity:maturity(1)}}});
  const high=overviewViewModel({portal:{profile:{employees:48,hourlyCost:80,maturity:maturity(5)}}});
  assert.ok(low);
  assert.ok(high);
  assert.equal(low.cards[0].value,'1,0/5');
  assert.equal(high.cards[0].value,'5,0/5');
  assert.notEqual(low.cards[1].value,high.cards[1].value);
  assert.notEqual(low.cards[3].value,high.cards[3].value);
  assert.equal(low.capacityNotCash,true);
  assert.equal(high.weeksPerYear,46);
});
