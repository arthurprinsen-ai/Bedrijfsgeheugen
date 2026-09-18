import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyOverviewCompleteModel, legacySharpnessModel } from '../modules/legacy-overview-complete.js';

const maturity={sturing:3,commercie:2,operatie:2,finance:1,mensen:2,analytics:3,quality:2,governance:2,tech:2,culture:3,service:2,security:3,duurzaam:2};
const state={portal:{
 profile:{employees:24,hourlyCost:52,industry:'Zakelijke dienstverlening',maturity},
 market:{industry:'Zakelijke dienstverlening'},
 metrics:{revenue:1000000},
 aiCapabilities:Object.fromEntries(Array.from({length:86},(_,i)=>['cap-'+i,3])),
 roadmap:{items:[{done:true},{done:false}]},
 advice:{items:[{title:'Eerste advies'}]}
}};

test('complete legacy overview ranks blockers by annual capacity value, not only maturity',()=>{
 const model=legacyOverviewCompleteModel(state);
 assert.equal(model.top[0].id,'finance');
 assert.ok(model.top[0].kosten>model.top[1].kosten);
 assert.ok(model.total>0);
 assert.equal(model.costs.length,13);
});

test('sharpness preserves the legacy 15/25/30/30 weighted completeness model',()=>{
 const model=legacySharpnessModel(state);
 assert.equal(model.blocks[0].pct,100);
 assert.equal(model.blocks[1].pct,100);
 assert.equal(model.blocks[2].pct,100);
 assert.equal(model.blocks[3].pct,70);
 assert.equal(model.total,91);
 assert.equal(model.band.label,'Compleet');
});

test('missing business truth remains visible as incompleteness and produces a next step',()=>{
 const empty={portal:{profile:{maturity:{}},aiCapabilities:{},roadmap:{items:[]}}};
 const model=legacySharpnessModel(empty);
 assert.equal(model.blocks[0].pct,0);
 assert.equal(model.blocks[2].pct,0);
 assert.equal(model.total,0);
 assert.match(model.next.title,/Profiel/);
});
