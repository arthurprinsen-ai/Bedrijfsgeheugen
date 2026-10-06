import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRootBudget, classifyRootItem } from '../../tools/notion/root-lifecycle.mjs';

const hubs=['Strategie & onderzoek','Product & technologie','Content & marketing','Sales & relaties','Operations','Archief'];

test('root budget passes when all hubs exist and count is bounded',()=>{
  const result=evaluateRootBudget({titles:[...hubs,'Dashboard'],rootCount:7,maxRootItems:50,requiredHubs:hubs});
  assert.equal(result.ok,true);
});

test('root budget fails when a hub is missing',()=>{
  const result=evaluateRootBudget({titles:hubs.slice(0,5),rootCount:5,maxRootItems:50,requiredHubs:hubs});
  assert.equal(result.ok,false);
  assert.deepEqual(result.missingHubs,['Archief']);
});

test('untitled root item is quarantine-classified',()=>{
  assert.equal(classifyRootItem({title:''},hubs),'quarantine');
});
