import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { executionValueMetrics, STANDARD_EXECUTION_SHARES, EXECUTION_REALIZABILITY, profileExecutionThemes } from '../modules/strategy-dna-execution.js';

const close=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<=epsilon,`expected ${actual} ≈ ${expected}`);

test('legacy execution ladder applies 70 percent realizability per selected theme',()=>{
  const result=executionValueMetrics({themes:[{id:'tech',annualManualCost:10000,shares:[.05,.15,.45,.20,.15]},{id:'finance',annualManualCost:5000,shares:[.10,.20,.40,.20,.10]}],completion:{tech:[true,true,false,false,false],finance:[true,false,false,false,false]}});
  close(result.potential,10500);close(result.realized,1750);assert.equal(result.completedSteps,3);assert.equal(result.totalSteps,10);
});

test('standard execution ladder preserves legacy distribution and cap',()=>{
  assert.deepEqual(STANDARD_EXECUTION_SHARES,[.10,.25,.35,.20,.10]);close(STANDARD_EXECUTION_SHARES.reduce((a,b)=>a+b,0),1);close(EXECUTION_REALIZABILITY,.70);
});

test('completed steps never realize more than the 70 percent cap',()=>{
  const result=executionValueMetrics({themes:[{id:'operatie',annualManualCost:20000,shares:[.2,.2,.2,.2,.2]}],completion:{operatie:[true,true,true,true,true]}});
  close(result.potential,14000);close(result.realized,14000);close(result.progress,1);
});

test('profile execution theme costs preserve legacy 46-week profile math',()=>{
  const state={portal:{profile:{employees:24,hourlyCost:52,maturity:{tech:2,finance:2}}}};
  const themes=Object.fromEntries(profileExecutionThemes(state).map(item=>[item.id,item]));
  close(themes.tech.annualManualCost,4.1*.78*46*52);
  close(themes.finance.annualManualCost,3.6*.78*46*52);
});

test('Strategy DNA mounts the native execution workspace and persists canonical V2 execution state',()=>{
  const page=readFileSync(new URL('../strategy-dna.js',import.meta.url),'utf8');
  const module=readFileSync(new URL('../modules/strategy-dna-execution.js',import.meta.url),'utf8');
  assert.match(page,/mountStrategyExecution/);
  assert.match(page,/data-strategy-execution-root/);
  assert.match(module,/portal\.strategy\.execution\.themeIds/);
  assert.match(module,/portal\.strategy\.execution\.completed/);
  assert.match(module,/domainState\.flush/);
});
