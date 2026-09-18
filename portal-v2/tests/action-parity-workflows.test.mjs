import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { strategyFindingToRoadmap, adviceItemToRoadmap, changeToTasks, appendUnique } from '../modules/legacy-action-parity.js';

test('strategy and advice writebacks preserve value owner priority and idempotency',()=>{
 const strategy=[strategyFindingToRoadmap({id:'s1',finding:'Automatiseer orderflow',value:25000,horizon:6,owner:'A'})];
 const advice=[adviceItemToRoadmap({id:'a1',advice:'Koppel CRM',value:12000,duration:8,priority:5,owner:'B'})];
 const merged=appendUnique(appendUnique([],strategy),advice);
 assert.equal(merged.length,2);
 assert.equal(merged[0].sourceFindingId,'s1');
 assert.equal(merged[1].sourceFindingId,'a1');
 assert.equal(appendUnique(merged,strategy).length,2);
});

test('high-impact change creates all three unique tasks and can be replayed idempotently',()=>{
 const tasks=changeToTasks({id:'c1',change:'Nieuw ERP',area:'Operatie',impact:5,owner:'B'},{due:'2026-10-01'});
 assert.equal(tasks.length,3);
 assert.equal(new Set(tasks.map(x=>x.sourceTaskId)).size,3);
 assert.deepEqual(tasks.map(x=>x.kind),['impact','implementation','assurance']);
 const replay=appendUnique(tasks,tasks,'sourceTaskId');
 assert.equal(replay.length,3);
});

test('functional suite exposes executable parity actions rather than navigation only',async()=>{
 const source=await readFile(new URL('../modules/functional-suite.js',import.meta.url),'utf8');
 assert.match(source,/strategy-to-roadmap/);
 assert.match(source,/advice-to-roadmap/);
 assert.match(source,/changes-to-tasks/);
 assert.match(source,/domainState\.set\('portal\.roadmap\.items'/);
 assert.match(source,/domainState\.set\('portal\.tasks\.items'/);
 assert.match(source,/await domainState\.flush/);
});

test('roadmap page mounts native roadmap workspace and has legacy edit actions',async()=>{
 const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
 const board=await readFile(new URL('../modules/roadmap-board.js',import.meta.url),'utf8');
 assert.match(shell,/mountRoadmapWorkspace/);
 assert.match(board,/data-move-left/);
 assert.match(board,/data-move-right/);
 assert.match(board,/data-duration-down/);
 assert.match(board,/data-duration-up/);
 assert.match(board,/data-toggle-done/);
 assert.match(board,/data-remove-roadmap/);
});

test('legacy strategy capability resolves to the execution strategy page',async()=>{
 const source=await readFile(new URL('../legacy-parity.js',import.meta.url),'utf8');
 assert.match(source,/strategie:'strategie-naar-maandagochtend'/);
 assert.doesNotMatch(source,/strategie:'strategiemodellen'/);
});
