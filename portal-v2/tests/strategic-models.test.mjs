import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBcgModel, buildBcgRoadmapAction, mergeBcgRoadmapAction } from '../strategic-models.js';

function state({growth=0,baseline=0,maturity=2}={}){
  return {portal:{
    profile:{maturity:{sturing:maturity,commercie:maturity,operatie:maturity}},
    market:{growth,digitalMaturity:baseline},
    strategicModels:{bcg:{note:''}}
  }};
}

test('BCG uses the exact legacy quadrant boundary even when branch digital maturity is zero',()=>{
  assert.equal(buildBcgModel(state({growth:2,baseline:0,maturity:2})).currentQuadrant,'ster');
  assert.equal(buildBcgModel(state({growth:1.5,baseline:0,maturity:2})).currentQuadrant,'melkkoe');
});

test('BCG preserves the exact legacy Hond explanation',()=>{
  const hond=buildBcgModel(state({growth:1,baseline:4,maturity:2})).quadrants.find(q=>q.id==='hond');
  assert.equal(hond.description,'Trage markt, achterstand. Niet groeien maar opruimen.');
});

test('Vraagteken produces a deterministic tenant-scoped roadmap action payload',()=>{
  const model=buildBcgModel(state({growth:3,baseline:4,maturity:2}));
  assert.equal(model.currentQuadrant,'vraagteken');
  const action=buildBcgRoadmapAction(model);
  assert.equal(action.source,'bcg');
  assert.equal(action.quadrant,'vraagteken');
  assert.match(action.title,/BCG/i);
  assert.match(action.title,/invest/i);
  assert.equal(action.done,false);
  assert.equal(action.progress,0);
});

test('BCG action merges into the existing canonical root roadmap and deduplicates by id',()=>{
  const model=buildBcgModel(state({growth:3,baseline:4,maturity:2}));
  const action=buildBcgRoadmapAction(model);
  const initial={...state({growth:3,baseline:4,maturity:2}),roadmap:[{id:'existing',title:'Bestaand'}]};
  const once=mergeBcgRoadmapAction(initial,action);
  const twice=mergeBcgRoadmapAction(once,action);
  assert.deepEqual(once.roadmap.map(x=>x.id),['existing',action.id]);
  assert.equal(twice.roadmap.filter(x=>x.id===action.id).length,1);
  assert.equal(twice.portal?.roadmap,undefined);
});
