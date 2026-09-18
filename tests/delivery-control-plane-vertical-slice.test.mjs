import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal claim is downstream of durable Brain ledger readback', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const durable=workflow.indexOf('Persist canonical Brain terminal evidence before terminal claim');
  const claim=workflow.indexOf('Persist terminal evidence and release writer lease');
  assert.ok(durable>0,'durable Brain evidence step missing');
  assert.ok(claim>durable,'LIVE_BEWEZEN claim must occur after durable Brain readback');
  assert.match(workflow,/id-token:\s*write/);
  assert.match(workflow,/powerhouse-control-plane-v1/);
  assert.match(workflow,/CONTROL_PLANE_DURABLE_READBACK_REJECTED/);
});

test('canonical production authority no longer contains retired Make transport', async()=>{
  const policy=JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
  const transports=policy.integration.productionAuthorityContract.transports;
  assert.deepEqual(transports,[{id:'github-native',priority:1,mode:'primary'}]);
  assert.equal(policy.integration.productionAuthorityContract.fallbackPolicy,'verified_transport_only');
  assert.ok(policy.lanes.every(lane=>lane.owner!=='agent-integration-make'));
});

test('evidence endpoint writes only to existing canonical Brain stores', async()=>{
  const endpoint=await readFile('netlify/functions/powerhouse-control-plane-evidence.mjs','utf8');
  for(const required of [
    "rpc('brain_create_obligation'",
    "rpc('brain_create_operation'",
    "rpc('brain_transition_operation'",
    "rpc('brain_transition_obligation'",
    'brain_delivery_evidence?on_conflict=idempotency_key',
    "terminal_state:'FULFILLED'",
  ]) assert.ok(endpoint.includes(required),`missing canonical store wiring: ${required}`);
  assert.doesNotMatch(endpoint,/create table|parallel.*ledger/i);
});
