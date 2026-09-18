import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreDeliveryRisk, classifyRecovery, adaptiveGatePlan } from '../tools/delivery/predictive-controller.mjs';

test('predictive risk keeps bounded ordinary changes FAST',()=>{
  assert.equal(scoreDeliveryRisk({changedPaths:['portal-v2/card.js']}).class,'FAST');
});
test('workflow and security changes become CRITICAL',()=>{
  assert.equal(scoreDeliveryRisk({changedPaths:['.github/workflows/x.yml','tools/security-check.mjs']}).class,'CRITICAL');
});
test('zero-run heads self-recover after first-signal SLO',()=>{
  const now=Date.parse('2026-09-18T10:10:00Z');
  assert.equal(classifyRecovery({workflowRuns:[],headUpdatedAt:'2026-09-18T10:08:00Z',now}).state,'ZERO_RUN_RECOVERY');
});
test('conflicts outrank queue waiting and refresh same rolling lane',()=>{
  const r=classifyRecovery({mergeable:false,workflowRuns:[{status:'queued'}],headUpdatedAt:'2026-09-18T10:08:00Z',now:Date.parse('2026-09-18T10:10:00Z')});
  assert.equal(r.action,'REFRESH_SAME_ROLLING_LANE_FROM_MAIN');
});
test('adaptive gates move unrelated assurance out of FAST critical path',()=>{
  const p=adaptiveGatePlan({riskClass:'FAST',affectedLanes:['portal']});
  assert.ok(p.blocking.includes('lane:portal'));
  assert.ok(p.shadow.includes('broad-regression'));
  assert.ok(!p.blocking.includes('broad-regression'));
});
test('critical protected work adds security and rollback blocking gates',()=>{
  const p=adaptiveGatePlan({riskClass:'CRITICAL',affectedLanes:['backend'],protectedSurfaces:['schema']});
  assert.ok(p.blocking.includes('security-integrity'));
  assert.ok(p.blocking.includes('rollback-readiness'));
});
