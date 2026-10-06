import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';
import { classifyWebsiteRelease } from '../tools/site-shell/website-release-risk.mjs';

const policy=JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
const riskConfig=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
const acceptedBaseline=JSON.parse(await readFile('site/accepted-baseline.json','utf8'));
const headSha='a'.repeat(40);

test('delivery latency control-plane changes never fan out into portal or website lanes',()=>{
  const changedPaths=[
    '.github/workflows/powerhouse-delivery-hygiene.yml',
    '.github/workflows/repo-writer-operational-verification.yml',
    'scripts/brain/material-writeback-closure-guard.mjs',
    'tests/delivery-latency-hardening-v1.test.mjs',
    'tests/repository-writer-slow-canary-sla.test.mjs',
    'brain/learning/2026-10-06-delivery-latency-hardening-v1.json',
    'docs/changes/2026-10-06-delivery-latency-hardening-v1.md',
    'docs/development-ledger-events/2026-10-06-delivery-latency-hardening-v1.md'
  ];
  const plan=createDeliveryPlan({changedPaths,headSha,policy});
  assert.deepEqual(plan.lanes.map(lane=>lane.id),['automation','backend']);
  assert.ok(!plan.lanes.some(lane=>lane.id==='website'));
  assert.ok(!plan.lanes.some(lane=>lane.id==='portal'));
  const website=classifyWebsiteRelease({changedPaths,riskConfig,acceptedBaseline});
  assert.equal(website.lane,'control-plane');
  assert.equal(website.requires_preview,false);
});

test('scheduler and writer-shadow control-plane changes avoid website browser assurance',()=>{
  const changedPaths=[
    '.github/scripts/pr-janitor.mjs',
    '.github/workflows/pr-janitor.yml',
    '.github/workflows/required-test.yml',
    '.github/workflows/repo-writer-candidate-shadow.yml',
    '.github/workflows/seo-controle.yml',
    '.github/workflows/paginacontrole.yml',
    '.github/workflows/weekblog.yml',
    'scripts/brain/test-writer-verification-modes.mjs',
    'tests/repo-writer-shadow.test.mjs',
    'tests/brain-actions-scheduler-hardening-v1.test.mjs'
  ];
  const plan=createDeliveryPlan({changedPaths,headSha,policy});
  assert.ok(plan.lanes.some(lane=>lane.id==='automation'));
  assert.ok(plan.lanes.some(lane=>lane.id==='backend'));
  assert.ok(!plan.lanes.some(lane=>lane.id==='website'));
  assert.ok(!plan.lanes.some(lane=>lane.id==='portal'));
  const website=classifyWebsiteRelease({changedPaths,riskConfig,acceptedBaseline});
  assert.equal(website.lane,'control-plane');
  assert.equal(website.requires_preview,false);
});

test('real website artifacts remain fail-closed and still require preview',()=>{
  const result=classifyWebsiteRelease({
    changedPaths:['.github/scripts/pr-janitor.mjs','index.html'],
    riskConfig,
    acceptedBaseline
  });
  assert.equal(result.requires_preview,true);
  assert.ok(result.affected_routes.includes('/'));
});
