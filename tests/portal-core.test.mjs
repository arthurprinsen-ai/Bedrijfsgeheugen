import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_ITEMS,SIGNAL_PIPELINE,canCompleteAction,riskPolicy,verifiedValue,routeFromHash,searchPortal } from '../portal/core.mjs';

test('portal has exactly eight canonical main areas',()=>assert.deepEqual(NAV_ITEMS.map(x=>x.id),['today','company','intelligence','decisions','execution','impact','memory','admin']));
test('intelligence follows verified signal pipeline',()=>assert.deepEqual(SIGNAL_PIPELINE,['signal','verify','match','impact','prioritise','recommend']));
test('Done requires owner execution verification and result',()=>{assert.equal(canCompleteAction({owner:'A',executed:true,verified:true,result:'ok'}),true);assert.equal(canCompleteAction({owner:'',executed:true,verified:true,result:'ok'}),false);assert.equal(canCompleteAction({owner:'A',executed:true,verified:false,result:'ok'}),false);assert.equal(canCompleteAction({owner:'A',executed:true,verified:true,result:null}),false)});
test('risk policy matches governance thresholds',()=>{assert.equal(riskPolicy(0),'autonomous');assert.equal(riskPolicy(20),'autonomous');assert.equal(riskPolicy(21),'autonomous-audit');assert.equal(riskPolicy(50),'autonomous-audit');assert.equal(riskPolicy(51),'approval');assert.equal(riskPolicy(80),'approval');assert.equal(riskPolicy(81),'human-controlled');assert.equal(riskPolicy(100),'human-controlled')});
test('verified value only counts realised and verified',()=>assert.equal(verifiedValue([{amount:100,stage:'Realised',verified:true},{amount:200,stage:'Approved',verified:true},{amount:300,stage:'Realised',verified:false}]),100));
test('routing falls back safely to today',()=>{assert.equal(routeFromHash('#/impact'),'impact');assert.equal(routeFromHash('#/nonsense'),'today');assert.equal(routeFromHash(''),'today')});
test('global search returns cross-domain matches',()=>{const r=searchPortal('marge');assert.ok(r.length>=2);assert.ok(r.some(x=>x.title.toLowerCase().includes('marge')))});
