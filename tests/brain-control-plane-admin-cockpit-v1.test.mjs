import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('control-plane API is fail-closed to explicit admin roles only', async()=>{
  const src=await readFile('netlify/functions/powerhouse-control-plane.mjs','utf8');
  assert.match(src,/powerhouse_admin/);
  assert.match(src,/roles\.includes\('admin'\)/);
  assert.match(src,/FORBIDDEN/);
  assert.match(src,/UNAUTHORIZED/);
});

test('control-plane Edge action reads only canonical projections', async()=>{
  const src=await readFile('supabase/functions/portal-state-eu/index.ts','utf8');
  assert.match(src,/action==='control_plane_cockpit'/);
  assert.match(src,/powerhouse_obligation_cockpit_v1/);
  assert.match(src,/powerhouse_control_plane_metrics_v1/);
  const block=src.slice(src.indexOf("if(action==='control_plane_cockpit')"),src.indexOf("if(action==='governance')"));
  assert.doesNotMatch(block,/\.insert\(|\.update\(|\.delete\(|\.upsert\(|rpc\(/);
});

test('portal mounts internal cockpit only after authorized 200 response', async()=>{
  const src=await readFile('portal-v2/control-plane-cockpit.js','utf8');
  assert.match(src,/\/api\/powerhouse-control-plane/);
  assert.match(src,/response\.status===401\|\|response\.status===403\|\|response\.status===404/);
  assert.match(src,/data-bg-component="powerhouse-control-plane-cockpit"/);
  assert.match(src,/requested_goal/);
  assert.match(src,/next_action/);
  assert.match(src,/actual_result/);
});

test('overview consumes cockpit without creating a second state model', async()=>{
  const src=await readFile('portal-v2/modules/overview.js','utf8');
  assert.match(src,/mountControlPlaneCockpit/);
  assert.doesNotMatch(src,/powerhouse_obligation_cockpit_v1|brain_obligations|brain_delivery_evidence/);
});
