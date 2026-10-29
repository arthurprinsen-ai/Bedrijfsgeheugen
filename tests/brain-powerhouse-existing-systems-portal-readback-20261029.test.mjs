import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectPowerhouseIntegrationReadback, readPowerhouseIntegrationReadback }
  from '../platform/portal/powerhouse-existing-integration-read-model.mjs';
import { powerhouseIntegrationMarkup, controlPlaneCockpitMarkup }
  from '../portal-v2/control-plane-cockpit.js';

const states={health:'LIVE',capabilities:'LIVE',layers:'LIVE',experiments:'LIVE',revenue:'LIVE'};
const datasets={
  health:[{observed_at:'2026-10-29T16:20:00Z',architecture_state:'AMBER',
    learning_state:'EVIDENCE_DUE_GAPS',content_loop_state:'BLOCKED',
    total_layers:32,wired_layers:32,required_jobs:18,active_jobs:18,
    current_runtime_errors:5,evidence_sparse_required_layers:2}],
  capabilities:[{capability_key:'revenue',domain:'revenue',
    connection_state:'CONNECTED_TO_ONE_BRAIN',evidence_rows:0}],
  layers:[{layer_key:'resource',domain:'economics',
    wiring_state:'WIRED',evidence_state:'NO_EVIDENCE_YET'}],
  experiments:[{readiness_state:'LATENT_WAITING_FOR_ELIGIBLE_ACTION',assignments:0,holdout_assignments:0}],
  revenue:[{scored_prospects:24361,next_best_actions:918,
    attribution_touches:17619,realized_revenue_eur:0,attributed_revenue_eur:0}]
};
const projection=()=>projectPowerhouseIntegrationReadback({datasets,readStates:states,at:'2026-10-29T17:00:00Z'});

test('canonical source is readable without claiming an end-to-end execution',()=>{
  const p=projection();
  assert.equal(p.sourceState,'READABLE');
  assert.equal(p.integrationState,'END_TO_END_UNPROVEN');
  assert.equal(p.architecture.wiredLayers,32);
  assert.equal(p.capabilities.wired,1);
  assert.equal(p.intelligence.withoutEvidence,1);
});
test('runtime problems, content and missing causal holdout remain visible',()=>{
  const p=projection();
  assert.equal(p.architecture.currentRuntimeErrors,5);
  assert.ok(p.gapCodes.includes('LEARNING_EVIDENCE_DUE'));
  assert.ok(p.gapCodes.includes('CONTENT_LOOP_NOT_VERIFIED'));
  assert.ok(p.gapCodes.includes('CAUSAL_HOLDOUT_NOT_OBSERVED'));
});
test('source absence is unknown instead of a fabricated zero or green status',()=>{
  const p=projectPowerhouseIntegrationReadback();
  assert.equal(p.sourceState,'PARTIAL');
  assert.equal(p.architecture,null);
  assert.equal(p.commercial,null);
  assert.ok(p.gapCodes.includes('SOURCE_UNAVAILABLE:health'));
});
test('structurally green health does not certify agents, business or revenue',()=>{
  const d=structuredClone(datasets);
  d.health[0].architecture_state='GREEN';
  d.health[0].learning_state='EVIDENCE_CURRENT';
  const p=projectPowerhouseIntegrationReadback({datasets:d,readStates:states});
  assert.equal(p.integrationState,'END_TO_END_UNPROVEN');
  assert.ok(p.gapCodes.includes('INDEPENDENT_BUSINESS_OUTCOME_VERIFICATION_REQUIRED'));
});
test('read-only REST readback uses original five authority views and never leaks key',async()=>{
  const mapping={
    powerhouse_one_brain_runtime_health_v1:datasets.health,
    powerhouse_one_brain_capability_inventory_v1:datasets.capabilities,
    powerhouse_one_brain_intelligence_inventory_v1:datasets.layers,
    powerhouse_autonomous_experiment_readiness_v1:datasets.experiments,
    powerhouse_revenue_event_spine_health_v1:datasets.revenue
  };
  const seen=[];
  const mock=async (url,options)=>{
    const key=new URL(url).pathname.split('/').at(-1);
    seen.push(key);
    assert.equal(options.headers.authorization,'Bearer secret');
    assert.equal(options.method,undefined);
    assert.match(url,/^https:\/\/project\.supabase\.co\/rest\/v1\//);
    return {ok:true,json:async()=>mapping[key]};
  };
  const p=await readPowerhouseIntegrationReadback({baseUrl:'https://project.supabase.co',key:'secret',fetchImpl:mock});
  assert.equal(seen.length,5);
  assert.equal(p.sourceState,'READABLE');
  assert.equal(p.integrationState,'END_TO_END_UNPROVEN');
  assert.doesNotMatch(JSON.stringify(p),/secret/);
});
test('provider errors and oversized responses fail closed',async()=>{
  const broken=await readPowerhouseIntegrationReadback({baseUrl:'https://project.supabase.co',
    key:'secret',fetchImpl:async()=>{throw Error('provider down');}});
  assert.equal(broken.sourceState,'PARTIAL');
  assert.equal(broken.architecture,null);
  const huge=await readPowerhouseIntegrationReadback({baseUrl:'https://project.supabase.co',
    key:'secret',fetchImpl:async()=>({ok:true,json:async()=>Array.from({length:101},()=>({}))})});
  assert.equal(huge.sourceState,'PARTIAL');
  assert.equal(huge.sourceReadStates.capabilities,'TRUNCATED');
});
test('panel is embedded in existing cockpit and can never claim green',()=>{
  const html=controlPlaneCockpitMarkup({systemIntegration:projection()});
  assert.match(html,/powerhouse-integration-health/);
  assert.match(html,/NIET BEWEZEN/);
  assert.match(html,/Heartbeat/);
  assert.match(html,/bron-omzet/);
});
test('untrusted text is escaped before reaching dashboard HTML',()=>{
  const p=projection();
  p.architecture.state='<script>alert(1)</script>';
  p.gapCodes=['<img src=x onerror=alert(1)>'];
  const html=powerhouseIntegrationMarkup(p);
  assert.doesNotMatch(html,/<script|<img/i);
  assert.match(html,/&lt;script&gt;/);
});
test('admin gate executes before service-role source read and no new scheduled writer exists',()=>{
  const backend=readFileSync('netlify/functions/powerhouse-control-plane.mjs','utf8');
  const helper=readFileSync('netlify/functions/_powerhouse-existing-integration-read-model.mjs','utf8');
  assert.ok(backend.indexOf('if(!hasAdminRole(user))')<
    backend.indexOf('readPowerhouseIntegrationReadback('));
  assert.doesNotMatch(helper,/method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)/);
  assert.doesNotMatch(helper,/schedule\s*:/);
  assert.match(backend,/cache-control.*private, no-store/);
});
