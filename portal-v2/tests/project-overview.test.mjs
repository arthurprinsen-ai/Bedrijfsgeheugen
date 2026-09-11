import test from 'node:test';
import assert from 'node:assert/strict';
import { projectOverviewModel } from '../project-overview.js';

test('project cockpit is fail-closed without project state',()=>{
  const model=projectOverviewModel({});
  assert.equal(model.phase,null);
  assert.equal(model.offerStatus,null);
  assert.equal(model.hours,null);
  assert.equal(model.budget,null);
  assert.equal(model.openTasks,null);
  assert.equal(model.documents,null);
  assert.equal(model.team,null);
  assert.deepEqual(model.activity,[]);
});

test('project cockpit projects only values actually present in state',()=>{
  const model=projectOverviewModel({
    portal:{
      project:{phase:'Bouwen',budget:12000,hours:34},
      offer:{status:'Akkoord'},
      delivery:{openTasks:5},
      documents:{count:8},
      access:{members:3},
      activity:[{label:'Koppeling getest'}]
    }
  });
  assert.equal(model.phase,'Bouwen');
  assert.equal(model.offerStatus,'Akkoord');
  assert.equal(model.hours,34);
  assert.equal(model.budget,12000);
  assert.equal(model.openTasks,5);
  assert.equal(model.documents,8);
  assert.equal(model.team,3);
  assert.deepEqual(model.activity,[{label:'Koppeling getest'}]);
});
