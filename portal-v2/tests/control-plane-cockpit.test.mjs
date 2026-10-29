import test from 'node:test';
import assert from 'node:assert/strict';
import { controlPlaneCockpitMarkup, mountControlPlaneCockpit } from '../control-plane-cockpit.js';

test('cockpit shows only requested operational decision fields per obligation',()=>{
  const html=controlPlaneCockpitMarkup({
    generatedAt:'2026-09-18T20:00:00Z',
    metrics:{obligations_total:2,obligations_fulfilled:1,first_time_right_pct:50,retries_total:1,escalations_total:0,false_success_risk_count:0,human_intervention_count:0},
    obligations:[{
      obligation_id:'1',obligation_key:'demo',requested_goal:'Doe het',current_state:'RUNNING',
      evidence_count:4,red_evidence_count:1,blocker:'Geen',next_action:'VERIFY_PRODUCTION',actual_result:'Nog open',
      retry_count:1,reconciliation_jobs:1,outcome_verified:false,migration_readback_verified:false
    }]
  });
  for(const value of ['Doe het','RUNNING','Bewijs','Blokkade','Volgende actie','VERIFY_PRODUCTION','Resultaat','Nog open']) assert.match(html,new RegExp(value));
  assert.doesNotMatch(html,/payload_sha256|service_role|raw evidence/i);
});

test('cockpit metrics include first-time-right and false-success visibility',()=>{
  const html=controlPlaneCockpitMarkup({metrics:{first_time_right_pct:75,false_success_risk_count:2},obligations:[]});
  assert.match(html,/First time right/);
  assert.match(html,/75\.0%/);
  assert.match(html,/False-success risk/);
});

test('FULFILLED without an actual outcome receipt is red rather than a green release',()=>{
  const html=controlPlaneCockpitMarkup({
    metrics:{obligations_total:1,obligations_fulfilled:1},
    obligations:[{obligation_key:'customer-value',requested_goal:'Waarde leveren',current_state:'FULFILLED',
      outcome_verified:false,migration_readback_verified:true,evidence_count:9,red_evidence_count:0}]
  });
  assert.match(html,/data-state="bad"/);
  assert.match(html,/FULFILLED · UITKOMST ONBEWEZEN/);
  assert.match(html,/Geclaimd afgerond/);
  assert.match(html,/Geen productiesucces bewezen/);
  assert.doesNotMatch(html,/data-state="ok"/);
});

test('Only literal outcome_verified=true promotes FULFILLED to green',()=>{
  const verified=controlPlaneCockpitMarkup({obligations:[
    {obligation_key:'done',current_state:'FULFILLED',outcome_verified:true}
  ]});
  assert.match(verified,/data-state="ok"/);
  assert.doesNotMatch(verified,/UITKOMST ONBEWEZEN|Geen productiesucces bewezen/);
  const forged=controlPlaneCockpitMarkup({obligations:[
    {obligation_key:'forged',current_state:'FULFILLED',outcome_verified:'true'}
  ]});
  assert.match(forged,/data-state="bad"/);
  assert.match(forged,/Outcome open/);
});

test('Unverified outcomes do not allow HTML injection into the control-plane screen',()=>{
  const html=controlPlaneCockpitMarkup({obligations:[
    {obligation_key:'<ScRiPt type="text/javascript">alert(1)</ScRiPt>',current_state:'FULFILLED',outcome_verified:null}
  ]});
  assert.doesNotMatch(html,/<script\b/i);
  assert.match(html,/&lt;ScRiPt type=&quot;text\/javascript&quot;&gt;/);
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
  const fs=requireNoop();
  // Read-only local source assertion prevents accidental restoration of ambient/cookie-only admin auth.
  assert.match(fs,/getUser\(request\)/);
  assert.match(fs,/request\.headers\?\.get\('authorization'\)/);
  assert.ok(fs.indexOf('getUser(request)')<fs.indexOf('hasAdminRole(user)'));
  assert.ok(fs.indexOf('hasAdminRole(user)')<fs.indexOf("BG_PORTAL_EU_SERVICE_TOKEN"));
});
function requireNoop(){
  return globalThis.__controlPlaneBackendTestSource||'';
}
