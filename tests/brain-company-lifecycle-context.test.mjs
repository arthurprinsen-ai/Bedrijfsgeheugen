import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCompanyLifecycleContext,inferCompanyLifecycleContext,COMPANY_LIFECYCLE_CONTEXTS} from '../brain/context/company-lifecycle.mjs';
import {buildBusinessContext,buildContextNarrative} from '../brain/context/business-context-engine.mjs';
import {buildCompanyDecisionProjection} from '../brain/operating-loop/company-decision-projection.mjs';

test('explicit lifecycle context wins and exposes connected models/pages',()=>{
  const ctx=buildCompanyLifecycleContext({company:{lifecycle_stage:'sell'}});
  assert.equal(ctx.stage,'sell');
  assert.equal(ctx.source,'explicit');
  assert.ok(ctx.models.includes('exit-readiness'));
  assert.ok(ctx.portal_pages.includes('exit'));
  assert.equal(ctx.evidence_mode,'derived');
});

test('financial evidence detects loss and acute continuity without guessing',()=>{
  assert.equal(inferCompanyLifecycleContext({finance:{profit:-100}}).stage,'loss');
  assert.equal(inferCompanyLifecycleContext({finance:{cash_runway_weeks:8,profit:-100}}).stage,'crisis');
  const fallback=inferCompanyLifecycleContext({});
  assert.equal(fallback.stage,'grow');
  assert.equal(fallback.confidence,0);
  assert.equal(fallback.source,'default');
});

test('transaction and portfolio context route to M&A and portfolio surfaces',()=>{
  assert.equal(inferCompanyLifecycleContext({transaction:{type:'buy-side'}}).stage,'buy');
  assert.equal(inferCompanyLifecycleContext({transaction:{type:'exit'}}).stage,'sell');
  assert.equal(inferCompanyLifecycleContext({portfolio:{companies:[{id:'a'},{id:'b'}]}}).stage,'portfolio');
  assert.ok(COMPANY_LIFECYCLE_CONTEXTS.buy.portal_pages.includes('due-diligence'));
  assert.ok(COMPANY_LIFECYCLE_CONTEXTS.portfolio.portal_pages.includes('os:impact-engine'));
});

test('brain records project lifecycle context into decision context',()=>{
  const records=[{
    id:'context:1',kind:'context',tenantId:'t1',subjectId:'company:1',status:'VERIFIED',owner:'directie',actor:'user:1',
    observedAt:'2026-09-22T10:00:00Z',payload:{lifecycle_stage:'buy'},evidenceIds:['e1']
  }];
  const projection=buildCompanyDecisionProjection(records,{tenantId:'t1'});
  assert.equal(projection.lifecycleContext.stage,'buy');
  assert.equal(projection.nextDecisionContext.lifecycleContext.stage,'buy');
});


test('business context supports one primary stage plus simultaneous strategic events and goals',()=>{
  const ctx=buildBusinessContext({
    portal:{
      business_context:{stage:'scale',events:['funding','buy'],goals:['automate','valuation']},
      finance:{revenue_growth_pct:45,cash_runway_weeks:40},
      maturity:{strategy:.7,process:.4,data:.5,technology:.6,people:.5,governance:.3}
    }
  });
  assert.equal(ctx.primary.stage,'scale');
  assert.deepEqual(ctx.events,['funding','buy']);
  assert.deepEqual(ctx.goals,['automate','valuation']);
  assert.ok(ctx.models.includes('capacity-model'));
  assert.ok(ctx.models.includes('normalized-ebitda'));
  assert.ok(ctx.models.includes('automation-potential'));
  assert.ok(ctx.pages.includes('due-diligence'));
  assert.ok(ctx.pages.includes('data-ai'));
  assert.equal(ctx.journey.current,'scale');
  assert.ok(ctx.journey.next.includes('professionalize'));
});

test('context narrative converts context into now decide do next surfaces',()=>{
  const ctx=buildBusinessContext({portal:{business_context:{stage:'loss',events:['restructure'],goals:['cash']},finance:{profit:-1,cash_runway_weeks:20}}});
  const narrative=buildContextNarrative(ctx);
  assert.match(narrative.headline,/Verlies & herstel/);
  assert.ok(narrative.now.includes('margin-leakage'));
  assert.ok(ctx.models.includes('13-week-cashflow'));
  assert.ok(ctx.pages.includes('actieve-acties'));
});

test('business context fails closed when the primary phase is not evidenced',()=>{
  const ctx=buildBusinessContext({});
  assert.equal(ctx.primary.stage,'grow');
  assert.equal(ctx.primary.confidence,0);
  assert.equal(ctx.evidenceMode,'unproven-default');
  const narrative=buildContextNarrative(ctx);
  assert.match(narrative.headline,/nog niet expliciet vastgesteld/i);
});
