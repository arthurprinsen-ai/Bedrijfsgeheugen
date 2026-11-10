import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectPowerhouseIntegrationReadback, readPowerhouseIntegrationReadback }
  from '../platform/portal/powerhouse-existing-integration-read-model.mjs';
import { powerhouseIntegrationMarkup, controlPlaneCockpitMarkup, mountControlPlaneCockpit }
  from '../portal-v2/control-plane-cockpit.js';

const states={health:'LIVE',capabilities:'LIVE',layers:'LIVE',experiments:'LIVE',revenue:'LIVE',loops:'LIVE',terminal:'LIVE',commercialHandoff:'LIVE',commercialIncidents:'LIVE'};
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
    attribution_touches:17619,realized_revenue_eur:0,attributed_revenue_eur:0}],
  loops:[{observed_at:'2026-10-29T16:20:00Z',total_loops:15,green_loops:8,
    amber_loops:1,red_loops:6,fully_evidenced_loops:8,overall_status:'RED'}],
  terminal:[{observed_at:'2026-10-29T16:20:00Z',nonterminal_obligations:4,
    blocked_obligations:3,escalated_reconciliation_jobs:1,
    control_plane_healthy:false,stale_green_truths:0}],
  commercialHandoff:[{measured_at:'2026-11-10T17:34:20Z',
    original_email_actions_7d:12,provider_readback_proven_7d:1,
    broken_or_unproven_handoffs_7d:10,linked_experiment_treatments_7d:0,
    provider_linked_replies_7d:0,provider_linked_meetings_7d:0,
    provider_linked_realized_revenue_eur_7d:0,handoff_health:'DEGRADED'}],
  commercialIncidents:[
    {fingerprint:'powerhouse|commercial|original-loop-handoff-and-learning-evidence-due|20261110-v1',
      scope:'powerhouse:commercial:original-end-to-end',severity:'HIGH',state:'ACTIVE',
      updated_at:'2026-11-10T17:37:09Z',resolved_at:null},
    {fingerprint:'powerhouse|commercial|original-source-wait-is-not-send|20261110-v1',
      scope:'powerhouse:commercial:original-research-handoff',severity:'HIGH',state:'RESOLVED',
      updated_at:'2026-11-10T17:37:28Z',resolved_at:'2026-11-10T17:37:28Z'}
  ]
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
test('read-only REST readback uses original authority views and native Brain blockers and never leaks key',async()=>{
  const mapping={
    powerhouse_one_brain_runtime_health_v1:datasets.health,
    powerhouse_one_brain_capability_inventory_v1:datasets.capabilities,
    powerhouse_one_brain_intelligence_inventory_v1:datasets.layers,
    powerhouse_autonomous_experiment_readiness_v1:datasets.experiments,
    powerhouse_revenue_event_spine_health_v1:datasets.revenue,
    powerhouse_loop_integrity_health_v1:datasets.loops,
    powerhouse_terminal_control_plane_health_v1:datasets.terminal,
    powerhouse_commercial_handoff_scorecard_v1:datasets.commercialHandoff,
    brain_blockers:datasets.commercialIncidents
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
  assert.equal(seen.length,9,'all nine original authority sources, including native Brain blockers, must be checked');
  assert.deepEqual(new Set(seen),new Set(Object.keys(mapping)),
    'provider reads must not escape the original nine-source allowlist');
  assert.equal(p.sourceState,'READABLE');
  assert.equal(p.loopAssurance.red,6);
  assert.equal(p.terminalControl.blocked,3);
  assert.ok(p.gapCodes.includes('LOOP_ASSURANCE_NOT_GREEN'));
  assert.ok(p.gapCodes.includes('TERMINAL_CONTROL_PLANE_UNHEALTHY'));
  assert.equal(p.integrationState,'END_TO_END_UNPROVEN');
  assert.doesNotMatch(JSON.stringify(p),/secret/);
});

test('missing original integrity or terminal provider view cannot create a false readable or green integration',async()=>{
 const tables=['powerhouse_loop_integrity_health_v1','powerhouse_terminal_control_plane_health_v1'];
 for(const missing of tables){
  const p=await readPowerhouseIntegrationReadback({baseUrl:'https://project.supabase.co',key:'private-key',
   fetchImpl:async url=>{
    if(new URL(url).pathname.endsWith('/'+missing))return {ok:false,status:503};
    const name=new URL(url).pathname.split('/').at(-1);
    const map={
      powerhouse_one_brain_runtime_health_v1:datasets.health,
      powerhouse_one_brain_capability_inventory_v1:datasets.capabilities,
      powerhouse_one_brain_intelligence_inventory_v1:datasets.layers,
      powerhouse_autonomous_experiment_readiness_v1:datasets.experiments,
      powerhouse_revenue_event_spine_health_v1:datasets.revenue,
      powerhouse_loop_integrity_health_v1:datasets.loops,
      powerhouse_terminal_control_plane_health_v1:datasets.terminal,
    powerhouse_commercial_handoff_scorecard_v1:datasets.commercialHandoff,
    brain_blockers:datasets.commercialIncidents
    };
    return {ok:true,json:async()=>map[name]||[]};
   }});
  assert.equal(p.sourceState,'PARTIAL');
  assert.equal(p.integrationState,'END_TO_END_UNPROVEN');
  assert.equal(p.sourceReadStates[missing===tables[0]?'loops':'terminal'],'UNAVAILABLE');
  assert.ok(p.gapCodes.includes('SOURCE_UNAVAILABLE:'+(missing===tables[0]?'loops':'terminal')));
  assert.doesNotMatch(JSON.stringify(p),/private-key/);
 }
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
  assert.match(html,/Bronnen LIVE: <strong>9 \/ 9<\/strong>/);
  assert.match(html,/NIET BEWEZEN/);
  assert.match(html,/Heartbeat/);
  assert.match(html,/bron-omzet/);
});

test('admin portal reports partial live-source coverage and never paints missing terminal evidence green',()=>{
 const incomplete=projectPowerhouseIntegrationReadback({
  datasets:{...datasets,terminal:[]},readStates:{...states,terminal:'UNAVAILABLE'},
  at:'2026-11-02T08:00:00Z'
 });
 const html=powerhouseIntegrationMarkup(incomplete);
 assert.match(html,/Bronnen LIVE: <strong>8 \/ 9<\/strong>/);
 assert.match(html,/Broncontrole: PARTIAL/);
 assert.match(html,/NIET BEWEZEN/);
 assert.match(html,/SOURCE_UNAVAILABLE:terminal/);
 assert.doesNotMatch(html,/Volledige uitvoeringsketen: <strong>BEWEZEN<\/strong>/);
});
test('the original commercial Brain register is separate from the repaired source-code status',()=>{
  const p=projection();
  assert.equal(p.commercialHandoff.state,'DEGRADED');
  assert.equal(p.commercialHandoff.providerProven7d,1);
  assert.equal(p.commercialHandoff.brokenOrUnproven7d,10);
  assert.equal(p.commercialIncidents.active,1);
  assert.equal(p.commercialIncidents.resolved,1);
  assert.ok(p.gapCodes.includes('COMMERCIAL_HANDOFF_PROOF_OPEN'));
  assert.ok(p.gapCodes.includes('HISTORICAL_COMMERCIAL_HANDOFF_DEBT_OPEN'));
  assert.ok(p.gapCodes.includes('ACTIVE_COMMERCIAL_BRAIN_INCIDENT_REQUIRES_READBACK'));
  const html=powerhouseIntegrationMarkup(p);
  assert.match(html,/data-bg-original-commercial-incidents="true"/);
  assert.match(html,/Brein · commerciële incidenten/);
  assert.match(html,/onbewezen\/verlopen 10/);
  assert.ok(html.includes('href="https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198"'));
  assert.match(html,/NIET BEWEZEN/);
});

test('missing original Brain incident authority fails closed rather than showing zero open incidents',()=>{
  const p=projectPowerhouseIntegrationReadback({
    datasets:{...datasets,commercialIncidents:[]},
    readStates:{...states,commercialIncidents:'UNAVAILABLE'}
  });
  assert.equal(p.sourceState,'PARTIAL');
  assert.equal(p.commercialIncidents,null);
  assert.ok(p.gapCodes.includes('SOURCE_UNAVAILABLE:commercialIncidents'));
  const html=powerhouseIntegrationMarkup(p);
  assert.match(html,/Origineel Brain-register onbereikbaar/);
  assert.match(html,/NIET BEWEZEN/);
});

test('commercial dashboard does not expose incident evidence, personal contact fields or secret credentials',async()=>{
 const secret='SECRET_SERVICE_ROLE_TOKEN';
 const seen=[];
 const mapping={
  powerhouse_one_brain_runtime_health_v1:datasets.health,
  powerhouse_one_brain_capability_inventory_v1:datasets.capabilities,
  powerhouse_one_brain_intelligence_inventory_v1:datasets.layers,
  powerhouse_autonomous_experiment_readiness_v1:datasets.experiments,
  powerhouse_revenue_event_spine_health_v1:datasets.revenue,
  powerhouse_loop_integrity_health_v1:datasets.loops,
  powerhouse_terminal_control_plane_health_v1:datasets.terminal,
  powerhouse_commercial_handoff_scorecard_v1:datasets.commercialHandoff,
  brain_blockers:[...datasets.commercialIncidents,
    {fingerprint:'unrelated-secret',scope:'private-other-tenant',
      severity:'HIGH',state:'ACTIVE',last_evidence:{recipient_email:'private@example.com'}}]
 };
 const result=await readPowerhouseIntegrationReadback({
  baseUrl:'https://project.supabase.co',key:secret,
  fetchImpl:async(url,options)=>{
    seen.push(url);
    assert.equal(options.headers.authorization,'Bearer '+secret);
    return {ok:true,json:async()=>mapping[new URL(url).pathname.split('/').at(-1)]};
  }
 });
 assert.ok(seen.find(v=>v.includes('/brain_blockers?')));
 assert.ok(seen.find(v=>v.includes('scope=like.powerhouse%3Acommercial%3A*')));
 assert.ok(seen.every(v=>!v.includes('last_evidence')&&!v.includes('recipient_email')));
 assert.equal(result.commercialIncidents.active,1);
 const html=powerhouseIntegrationMarkup(result);
 assert.doesNotMatch(JSON.stringify(result)+html,/SECRET_SERVICE_ROLE_TOKEN|private@example.com|unrelated-secret|last_evidence/);
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
  const helper=readFileSync('platform/portal/powerhouse-existing-integration-read-model.mjs','utf8');
  assert.ok(backend.indexOf('if(!hasAdminRole(user))')<
    backend.indexOf('readPowerhouseIntegrationReadback('));
  assert.doesNotMatch(helper,/method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)/);
  assert.doesNotMatch(helper,/schedule\s*:/);
  assert.match(backend,/cache-control.*private, no-store/);
  // Production Netlify sets the existing EU portal URL and service role;
  // SUPABASE_URL is intentionally absent. Do not silently turn the view PARTIAL.
  assert.match(backend,/BG_PORTAL_EU_SUPABASE_URL/);
  assert.match(backend,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.ok(backend.indexOf("process.env.BG_PORTAL_EU_SUPABASE_URL")>
    backend.indexOf('if(!hasAdminRole(user))'));

});

function makeControlPlaneRoot(){
  let host=null;
  const doc={head:{appendChild(){}},getElementById(){return true},createElement(){
    return {dataset:{},innerHTML:''};
  }};
  const main={querySelector(){return host},appendChild(value){host=value}};
  return {root:{ownerDocument:doc,querySelector(selector){return selector==='.main'?main:null}},
    host:()=>host};
}

test('anonymous visitors cannot call the admin control-plane endpoint',async()=>{
  const {root}=makeControlPlaneRoot();
  let calls=0;
  const result=await mountControlPlaneCockpit(root,{identityImpl:async()=>null,fetchImpl:async()=>{calls++;throw Error('SHOULD_NOT_CALL')}});
  assert.equal(result,null);
  assert.equal(calls,0);
});

test('valid Identity JWT is sent only in authorization header to same-origin read-only endpoint',async()=>{
  const {root,host}=makeControlPlaneRoot();
  let requests=0;
  const result=await mountControlPlaneCockpit(root,{
    identityImpl:async()=>({currentUser:()=>({jwt:async()=>'real-signed-token'})}),
    fetchImpl:async(url,options)=>{
      requests++;
      assert.equal(url,'/api/powerhouse-control-plane');
      assert.equal(options.headers.authorization,'Bearer real-signed-token');
      assert.equal(options.headers.accept,'application/json');
      assert.equal(options.credentials,'same-origin');
      assert.equal(options.cache,'no-store');
      assert.equal(options.method,undefined);
      return {ok:true,status:200,json:async()=>({metrics:{obligations_total:1},obligations:[],
        systemIntegration:{sourceState:'PARTIAL',gapCodes:['INDEPENDENT_BUSINESS_OUTCOME_VERIFICATION_REQUIRED']}})};
    }
  });
  assert.equal(requests,1);
  assert.ok(result?.host===host());
  assert.match(result.host.innerHTML,/END_TO_END_UNPROVEN/);
});

test('expired session, token with spaces and non-admin 403 never render an admin readback',async()=>{
  const {root,host}=makeControlPlaneRoot();
  let calls=0;
  for(const identityImpl of [
    async()=>({currentUser:()=>({jwt:async()=>''})}),
    async()=>({currentUser:()=>({jwt:async()=>{throw Error('EXPIRED')}})}),
    async()=>({currentUser:()=>({jwt:async()=> 'malformed jwt'})})
  ]){
    const value=await mountControlPlaneCockpit(root,{identityImpl,fetchImpl:async()=>{calls++;throw Error('UNSAFE')}});
    assert.equal(value,null);
  }
  assert.equal(calls,0);
  const blocked=await mountControlPlaneCockpit(root,{
    identityImpl:async()=>({currentUser:()=>({jwt:async()=>'token'})}),
    fetchImpl:async()=>({status:403,ok:false})
  });
  assert.equal(blocked,null);
  assert.equal(host(),null);
});

test('server verifies request bearer and role before any Supabase service-key reads',()=>{
  const source=readFileSync('netlify/functions/powerhouse-control-plane.mjs','utf8');
  assert.match(source,/getUser\(request\)/);
  assert.match(source,/request\.headers\?\.get\('authorization'\)/);
  assert.ok(source.indexOf('getUser(request)')<source.indexOf('if(!hasAdminRole(user))'));
  assert.ok(source.indexOf('if(!hasAdminRole(user))')<source.indexOf("const baseUrl="));
});
