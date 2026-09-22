import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLifecycleProjection,detectLifecycleContext,LIFECYCLE_CONTEXTS,SCALE_CORE_SURFACES} from '../lifecycle-context.js';
import {nativePageContent} from '../native-pages.js';
import {allPageIds} from '../page-registry.js';

test('portal lifecycle detector routes explicit, financial, M&A and portfolio context',()=>{
  assert.equal(detectLifecycleContext({portal:{lifecycle:{stage:'loss'}}}).stage,'loss');
  assert.equal(detectLifecycleContext({portal:{finance:{cash_runway_weeks:5}}}).stage,'crisis');
  assert.equal(detectLifecycleContext({portal:{transaction:{type:'acquisition'}}}).stage,'buy');
  assert.equal(detectLifecycleContext({portal:{transaction:{type:'sell-side'}}}).stage,'sell');
  assert.equal(detectLifecycleContext({portal:{portfolio:{companies:[{id:1},{id:2}]}}}).stage,'portfolio');
});

test('Scale core exposes all intelligence surfaces while commercial limits remain operational',()=>{
  for(const required of ['Executive cockpit','Strategy DNA','€ Impact Engine','Scenario Simulator','Capability Graph','Due diligence','Exit','Portfolio-context']){
    assert.ok(SCALE_CORE_SURFACES.includes(required),required);
  }
  const projection=buildLifecycleProjection({portal:{admin:{billing:{plan:'scale',status:'active'}},lifecycle:{stage:'grow'}}});
  assert.equal(projection.plan.code,'scale');
  assert.equal(projection.context.id,'grow');
});

test('portal registry contains contextual workspaces and existing M&A pages remain connected',()=>{
  const ids=allPageIds();
  for(const id of ['bedrijfssituatie','herstel-continuiteit','portfolio-control','due-diligence','exit'])assert.ok(ids.includes(id),id);
  assert.ok(LIFECYCLE_CONTEXTS.buy.pages.includes('due-diligence'));
  assert.ok(LIFECYCLE_CONTEXTS.sell.pages.includes('exit'));
});

test('native lifecycle pages render context, models, connections and Scale core',()=>{
  const state={portal:{lifecycle:{stage:'buy'},runtime:{sources:{items:[{id:'s1'}]},actions:{items:[{id:'a1'}]},outcomes:{items:[{id:'o1'}]}},admin:{billing:{plan:'scale',status:'active'}}}};
  const page=nativePageContent('bedrijfssituatie',state);
  assert.ok(page);
  const titles=page.blocks.map(x=>x.title);
  assert.ok(titles.includes('Contextstatus'));
  assert.ok(titles.includes('Powerhouse-verbindingen'));
  assert.ok(titles.includes('Relevante modellen'));
  assert.ok(titles.includes('Verbonden portaalonderdelen'));
  assert.ok(titles.includes('Scale — volledige kernintelligentie'));
  assert.equal(page.lifecycle.stage,'buy');
});
