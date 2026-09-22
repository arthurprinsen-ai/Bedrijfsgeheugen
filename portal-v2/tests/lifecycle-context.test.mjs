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


test('portal business context carries stage overlays health maturity journey and relevant surfaces',()=>{
  const state={portal:{
    business_context:{stage:'scale',events:['funding','buy'],goals:['automate']},
    finance:{revenue_growth_pct:40,cash_runway_weeks:30},
    maturity:{strategy:.8,process:.4,data:.5,technology:.7,people:.5,governance:.4},
    runtime:{sources:{items:[{id:'s1'}]},actions:{items:[{id:'a1'}]},outcomes:{items:[{id:'o1'}]}},
    admin:{billing:{plan:'scale',status:'active'}}
  }};
  const projection=buildLifecycleProjection(state);
  assert.equal(projection.businessContext.primary.stage,'scale');
  assert.deepEqual(projection.businessContext.events,['funding','buy']);
  assert.ok(projection.businessContext.models.includes('normalized-ebitda'));
  assert.ok(projection.businessContext.pages.includes('due-diligence'));
  assert.ok(projection.businessContext.journey.next.includes('professionalize'));
  assert.equal(projection.businessContext.health.cash,'healthy');
  assert.equal(projection.businessContext.maturity.process,.4);
  assert.match(projection.narrative.headline,/Snelle groei/);
});

test('bedrijfssituatie page returns living company journey instead of a package-only view',()=>{
  const state={portal:{
    business_context:{stage:'professionalize',events:['succession'],goals:['valuation']},
    maturity:{strategy:.7,process:.4,data:.5,technology:.6,people:.45,governance:.35},
    runtime:{sources:{items:[{id:'s1'}]},actions:{items:[{id:'a1'}]},outcomes:{items:[{id:'o1'}]}},
    admin:{billing:{plan:'control',status:'active'}}
  }};
  const page=nativePageContent('bedrijfssituatie',state);
  const titles=page.blocks.map(b=>b.title);
  for(const expected of ['Waar staat het bedrijf nu?','Wat speelt tegelijk?','Nu weten / nu beslissen / nu doen','Bedrijfsgezondheid','Volwassenheid per capability','Bedrijfsreis — wat kan hierna komen?']){
    assert.ok(titles.includes(expected),expected);
  }
  assert.equal(page.businessContext.primary.stage,'professionalize');
  assert.ok(page.businessContext.events.includes('succession'));
  assert.ok(page.businessContext.goals.includes('valuation'));
});
