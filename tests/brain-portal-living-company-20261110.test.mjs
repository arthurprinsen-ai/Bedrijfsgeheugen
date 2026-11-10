import test from 'node:test';
import assert from 'node:assert/strict';
import '../portal-v2/tests/decision-world.test.mjs';
import {buildDecisionWorldNodes} from '../portal-v2/decision-world.js';

// Canonical executable ONE BRAIN replay of the original customer-evidence boundary.
test('Brain rejects a fabricated completed stage when only a goal is known',()=>{
 const home={authenticated:true,selectedGoal:'profit',headline:'Meer winst'};
 const journey={authenticated:true,steps:[
  {id:'goal',confirmed:true,detail:'Doel opgeslagen'},
  {id:'outcome',confirmed:null,detail:'Geen gerealiseerd bewijs'}
 ]};
 const result=buildDecisionWorldNodes(home,journey);
 assert.deepEqual(result.filter(x=>x.confirmed).map(x=>x.id),['goal']);
 assert.equal(result.find(x=>x.id==='outcome').status,'Effect niet aangetoond');
 assert.equal(result.length,5);
});
