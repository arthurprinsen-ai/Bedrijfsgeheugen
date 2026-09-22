import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCompanyLifecycleContext,inferCompanyLifecycleContext,COMPANY_LIFECYCLE_CONTEXTS} from '../brain/context/company-lifecycle.mjs';
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
