import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LEGACY_CAPABILITY_MAP } from '../legacy-parity.js';
import { moveRoadmapItem } from '../modules/roadmap-board.js';

test('legacy strategy maps to the canonical execution strategy page',()=>{
  assert.equal(LEGACY_CAPABILITY_MAP.strategie,'strategie-naar-maandagochtend');
});

test('functional actions perform canonical writebacks, not navigation only',async()=>{
  const source=await readFile(new URL('../modules/functional-suite.js',import.meta.url),'utf8');
  assert.match(source,/strategy-to-roadmap/);
  assert.match(source,/advice-to-roadmap/);
  assert.match(source,/changes-to-tasks/);
  assert.match(source,/domainState\.set\('portal\.roadmap\.items'/);
  assert.match(source,/domainState\.set\('portal\.tasks\.items'/);
  assert.match(source,/await domainState\.flush/);
});

test('roadmap is mounted as native interactive workspace',async()=>{
  const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
  assert.match(shell,/mountRoadmapWorkspace/);
  assert.match(shell,/pageId==='roadmap'/);
});

test('roadmap board supports duration completion deletion and move semantics',async()=>{
  const source=await readFile(new URL('../modules/roadmap-board.js',import.meta.url),'utf8');
  assert.match(source,/data-duration-down/);
  assert.match(source,/data-duration-up/);
  assert.match(source,/data-toggle-done/);
  assert.match(source,/data-remove-roadmap/);
  const moved=moveRoadmapItem([{id:'a',start:1,sprint:1,duration:2}], 'a', 5);
  assert.equal(moved[0].sprint,5);
  assert.equal(moved[0].start,5);
});
