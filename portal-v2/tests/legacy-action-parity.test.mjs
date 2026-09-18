import test from 'node:test';
import assert from 'node:assert/strict';
import {strategyFindingToRoadmap,adviceItemToRoadmap,changeToTasks,appendUnique,moveRoadmapItem,toggleRoadmapDone,removeRoadmapItem} from '../modules/legacy-action-parity.js';

test('strategy and advice become canonical roadmap items',()=>{
 const s=strategyFindingToRoadmap({finding:'Automatiseer orderflow',value:25000,horizon:6,owner:'A'});
 assert.equal(s.title,'Automatiseer orderflow');assert.equal(s.value,25000);assert.equal(s.duration,6);assert.equal(s.source,'strategy-finding');
 const a=adviceItemToRoadmap({advice:'Koppel CRM',value:12000,duration:8,priority:5});
 assert.equal(a.duration,2);assert.equal(a.priority,5);assert.equal(a.source,'advice-item');
});
test('change creates implementation tasks and assurance for high impact',()=>{
 const tasks=changeToTasks({change:'Nieuw ERP',area:'Operatie',impact:5,owner:'B'},{due:'2026-10-01'});
 assert.equal(tasks.length,3);assert.ok(tasks.every(x=>x.sourceChangeId));assert.equal(tasks[2].kind,'assurance');
});
test('appendUnique prevents duplicate writeback',()=>{
 const x={sourceFindingId:'x',title:'X'};assert.equal(appendUnique([x],[x]).length,1);
});
test('roadmap supports move complete and remove',()=>{
 let items=[{title:'X',start:1,duration:2,progress:20,done:false}];
 items=moveRoadmapItem(items,0,4,3);assert.equal(items[0].start,4);assert.equal(items[0].duration,3);
 items=toggleRoadmapDone(items,0);assert.equal(items[0].done,true);assert.equal(items[0].progress,100);
 items=removeRoadmapItem(items,0);assert.equal(items.length,0);
});
