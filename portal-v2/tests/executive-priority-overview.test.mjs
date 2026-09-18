import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { legacyOverviewCompleteModel } from '../modules/legacy-overview-complete.js';

const maturity=level=>Object.fromEntries(['sturing','commercie','operatie','finance','mensen','analytics','quality','governance','tech','culture','service','security','duurzaam'].map(id=>[id,level]));

test('overview exposes old decision cards with priority value friction and hours',()=>{
  const state={portal:{
    profile:{employees:24,hourlyCost:50,manualHoursPerWeek:10,maturity:maturity(2)},
    businessCase:{target:4,delay:6,investment:10000},
    metrics:{revenue:1000000,ebitda:100000,grossMargin:30,dso:60},
    market:{industry:'ICT & software'},
    roadmap:{items:[]}
  }};
  const model=legacyOverviewCompleteModel(state);
  assert.ok(model.priorities.length>0);
  const first=model.priorities[0];
  assert.ok(Number.isFinite(first.score));
  assert.ok(['hoog','middel','laag'].includes(first.priority));
  assert.ok(Object.hasOwn(first,'waarde'));
  assert.ok(Object.hasOwn(first,'moeite'));
  assert.ok(Object.hasOwn(first,'hours'));
});

test('complete legacy overview is mounted on the V2 start page',async()=>{
  const source=await readFile(new URL('../modules/overview.js',import.meta.url),'utf8');
  assert.match(source,/renderLegacyOverviewComplete\(root,state,openPortalPage,globalThis\.__BG_PORTAL_DOMAIN_STATE__\)/);
});

test('overview priority cards mutate canonical roadmap state instead of keeping local state',async()=>{
  const source=await readFile(new URL('../modules/legacy-overview-complete.js',import.meta.url),'utf8');
  assert.match(source,/data-add-roadmap/);
  assert.match(source,/domainState\.set\('portal\.roadmap\.items'/);
  assert.match(source,/await domainState\.flush/);
  assert.match(source,/sourceFindingId/);
});

test('priority overview is first in customizable overview order',async()=>{
  const source=await readFile(new URL('../modules/overview-reorder.js',import.meta.url),'utf8');
  const priority=source.indexOf("id:'legacy-complete'");
  const kpis=source.indexOf("id:'kpis'");
  assert.ok(priority>=0&&kpis>=0&&priority<kpis);
});
