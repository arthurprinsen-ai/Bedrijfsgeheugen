import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateKeyPairSync, sign } from 'node:crypto';
import { verifyGitHubOidcToken } from '../netlify/functions/powerhouse-control-plane-evidence.mjs';

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

test('evidence flow writes only to existing canonical Brain stores through the server trust boundary', async()=>{
  const endpoint=await readFile('netlify/functions/powerhouse-control-plane-evidence.mjs','utf8');
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(endpoint,/functions\/v1\/growth-datahub-ingest/);
  for(const required of [
    "client.rpc('brain_create_obligation'",
    "client.rpc('brain_create_operation'",
    "client.rpc('brain_transition_operation'",
    "client.rpc('brain_transition_obligation'",
    "client.from('brain_delivery_evidence')",
    "terminal_state:'FULFILLED'",
  ]) assert.ok(edge.includes(required),`missing canonical store wiring: ${required}`);
  assert.doesNotMatch(endpoint+edge,/create table|parallel.*ledger/i);
});

function enc(value){return Buffer.from(JSON.stringify(value)).toString('base64url');}

test('control-plane OIDC accepts exact repository/workflow/audience lineage', async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk=publicKey.export({format:'jwk'});
  jwk.kid='test-kid'; jwk.alg='RS256'; jwk.use='sig';
  const now=Math.floor(Date.now()/1000);
  const header={alg:'RS256',kid:'test-kid',typ:'JWT'};
  const payload={
    iss:'https://token.actions.githubusercontent.com',
    aud:'powerhouse-control-plane-v1',
    repository:'arthurprinsen-ai/Bedrijfsgeheugen',
    workflow_ref:'arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/obligation-terminal-closure.yml@refs/heads/main',
    actor:'arthurprinsen-ai',
    exp:now+300,
    nbf:now-5,
  };
  const unsigned=`${enc(header)}.${enc(payload)}`;
  const signature=sign('RSA-SHA256',Buffer.from(unsigned),privateKey).toString('base64url');
  const claims=await verifyGitHubOidcToken(`${unsigned}.${signature}`,{
    now,
    fetchImpl:async()=>new Response(JSON.stringify({keys:[jwk]}),{status:200}),
  });
  assert.equal(claims.repository,'arthurprinsen-ai/Bedrijfsgeheugen');
});

test('control-plane OIDC rejects another workflow lineage', async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk=publicKey.export({format:'jwk'});
  jwk.kid='test-kid'; jwk.alg='RS256'; jwk.use='sig';
  const now=Math.floor(Date.now()/1000);
  const header={alg:'RS256',kid:'test-kid',typ:'JWT'};
  const payload={
    iss:'https://token.actions.githubusercontent.com',
    aud:'powerhouse-control-plane-v1',
    repository:'arthurprinsen-ai/Bedrijfsgeheugen',
    workflow_ref:'arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/other.yml@refs/heads/main',
    exp:now+300,
  };
  const unsigned=`${enc(header)}.${enc(payload)}`;
  const signature=sign('RSA-SHA256',Buffer.from(unsigned),privateKey).toString('base64url');
  await assert.rejects(
    ()=>verifyGitHubOidcToken(`${unsigned}.${signature}`,{
      now,
      fetchImpl:async()=>new Response(JSON.stringify({keys:[jwk]}),{status:200}),
    }),
    /OIDC_WORKFLOW_REJECTED/,
  );
});

test('terminal evidence uses existing Supabase Edge trust boundary, not app token as PostgREST key', async()=>{
  const endpoint=await readFile('netlify/functions/powerhouse-control-plane-evidence.mjs','utf8');
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(endpoint,/functions\/v1\/growth-datahub-ingest/);
  assert.match(endpoint,/action:'control_plane_terminal'/);
  assert.doesNotMatch(endpoint,/\/rest\/v1\//);
  assert.match(edge,/if\(action==='control_plane_terminal'\)/);
  assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(edge,/brain_create_obligation/);
  assert.match(edge,/brain_create_operation/);
  assert.match(edge,/brain_delivery_evidence/);
  assert.match(edge,/p_state:'FULFILLED'/);
});

test('fulfilled obligations refresh terminal identity on replay', async()=>{
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(edge,/const terminalIdentityChanged=obligation\?\.evidence\?\.main_sha!==mainSha/);
  assert.match(edge,/obligation\.state!=='FULFILLED'\|\|terminalIdentityChanged/);
  assert.match(edge,/p_state:'FULFILLED'/);
});


test('terminal closure recovers only cancelled or missing canonical readback through descendant live proof', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/source_conclusion.*cancelled/);
  assert.match(workflow,/PRODUCTION_READBACK_FAILED/);
  assert.match(workflow,/PRODUCTION_DESCENDANT_READBACK_PROVEN/);
  assert.match(workflow,/git merge-base --is-ancestor "\$MERGE_SHA" "\$observed"/);
  assert.match(workflow,/api\/connectors\/readiness/);
  assert.match(workflow,/release\.contract!=='BRAIN-DELIVERY-v2'/);
  assert.match(workflow,/release\.production_authority!=='BG169'/);
});

test('terminal evidence distinguishes canonical run from descendant live production proof', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(workflow,/mode=canonical_run/);
  assert.match(workflow,/mode=descendant_live/);
  assert.match(workflow,/production_readback_mode/);
  assert.match(workflow,/production_observed_sha/);
  assert.match(workflow,/production_deploy_id/);
  assert.match(edge,/productionReadbackMode/);
  assert.match(edge,/PRODUCTION_DESCENDANT_READBACK_NOT_VERIFIED/);
  assert.match(edge,/production-descendant:/);
});


test('control-plane cockpit reuses canonical Brain cockpit and metrics projections', async()=>{
  const edge=await readFile('supabase/functions/growth-datahub-ingest/index.ts','utf8');
  assert.match(edge,/action==='control_plane_cockpit'/);
  assert.match(edge,/powerhouse_obligation_cockpit_v1/);
  assert.match(edge,/powerhouse_control_plane_metrics_v1/);
  assert.match(edge,/CONTROL_PLANE_COCKPIT_READ_FAILED/);
});
