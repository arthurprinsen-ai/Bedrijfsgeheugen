import test from 'node:test';
import assert from 'node:assert/strict';
import { selectExecutionThemeIds, executionSignalDimensions } from '../modules/strategy-dna-execution.js';

const themes=[
  {id:'sturing',level:2,annualManualCost:4000},
  {id:'tech',level:3,annualManualCost:12000},
  {id:'finance',level:4,annualManualCost:9000},
  {id:'mensen',level:2,annualManualCost:5000},
  {id:'operatie',level:3,annualManualCost:7000},
];

test('legacy selector chooses weakest link, most expensive theme and most frequently referenced valid dimension',()=>{
  const selected=selectExecutionThemeIds(themes,['mensen','mensen','operatie','mensen','finance']);
  assert.deepEqual(selected,['sturing','tech','mensen']);
});

test('legacy selector removes duplicates and fills remaining slots by descending cost',()=>{
  const selected=selectExecutionThemeIds(themes,['sturing','sturing']);
  assert.deepEqual(selected,['sturing','tech','finance']);
});

test('explicit canonical strategy/advice signals stay first before automatic legacy model signals',()=>{
  const state={portal:{
    strategy:{execution:{signalDimensions:['finance']},findings:[{dimension:'tech'},{dim:'mensen'},{dimension:'unknown'}]},
    advice:{items:[{dimension:'mensen'},{dim:'operatie'},{advice:'no dimension'}]}
  }};
  const actual=executionSignalDimensions(state);
  assert.deepEqual(actual.slice(0,6),['finance','tech','mensen','unknown','mensen','operatie']);
  assert.ok(actual.length>6);
});
