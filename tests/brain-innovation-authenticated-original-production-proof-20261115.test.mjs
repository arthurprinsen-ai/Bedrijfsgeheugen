import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isPowerhouseAdmin} from '../platform/auth/powerhouse-admin.mjs';
import {
  runPortalAuthenticatedProductionProof,
  projectOriginalInnovationAdminProof,
  assertOriginalInnovationProductionReleaseProof
} from '../platform/api/portal-authenticated-production-proof-core.mjs';

const sha='a'.repeat(40),id='original-innovation-release-proof';
const deploy={id,commitRef:sha,context:'production',
  permalinkUrl:'https://original-proof--bedrijfsgeheugen.netlify.app'};
const jwt=payload=>[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
  Buffer.from(JSON.stringify(payload)).toString('base64url'),'signature'].join('.');
const audit=(override={})=>({systemIntegration:{salesExecutionAudit:{
  state:'HISTORICAL_WRITER_ACTION_JOINED_PROVIDER_UNVERIFIED',
  totalEvents7d:164,sampledEvents:164,actionBackedSample:164,
  unsupportedSample:0,missingActionSample:0,currentActionNotDoneSample:1,
  currentExecutionWithoutEventSample:0,
  scope:'FULL_LAST_7D',externalProviderProof:false,paidOutcomeProof:false,readOnly:true,
  ...override
}}});

test('original immutable source census is sanitized and rejects fake provider outcomes or missing half the week',()=>{
  const result=projectOriginalInnovationAdminProof(audit(),'FULL_LAST_7D');
  assert.deepEqual(result,{
    scope:'FULL_LAST_7D',total:164,historical_writer_backed:164,
    unsupported:0,missing_actions:0,currently_not_done:1,
    unlogged_execution_attempts:0,internal_source_gap_present:false,
    external_provider_proven:false,business_outcome_proven:false
  });
  for(const altered of [
    {sampledEvents:100},{totalEvents7d:501},{totalEvents7d:0,sampledEvents:0,actionBackedSample:0},
    {actionBackedSample:163},{unsupportedSample:1},
    {currentActionNotDoneSample:165},{currentExecutionWithoutEventSample:165},
    {externalProviderProof:true},
    {paidOutcomeProof:true},{readOnly:false},{scope:'LATEST_100_ONLY'},
    {state:'END_TO_END_VERIFIED'}
  ])assert.equal(projectOriginalInnovationAdminProof(audit(altered),'FULL_LAST_7D'),null,JSON.stringify(altered));
  assert.equal(projectOriginalInnovationAdminProof(audit(),'UNKNOWN'),null);
  assert.equal(projectOriginalInnovationAdminProof({},'FULL_LAST_7D'),null);
  assert.equal(projectOriginalInnovationAdminProof(audit({
    state:'SOURCE_EXECUTION_GAP',actionBackedSample:163,unsupportedSample:1,
    missingActionSample:1,currentActionNotDoneSample:1
  }),'FULL_LAST_7D').unsupported,1);
});

test('same signed Identity admin boundary accepts canonical role; nonadmin and user-controlled metadata cannot grant it',()=>{
  assert.equal(isPowerhouseAdmin({id:'a',app_metadata:{roles:['powerhouse-admin']}}),true);
  assert.equal(isPowerhouseAdmin({id:'a',appMetadata:{roles:['powerhouse-admin']}}),true);
  assert.equal(isPowerhouseAdmin({id:'b',app_metadata:{roles:[]}}),false);
  assert.equal(isPowerhouseAdmin({id:'b',user_metadata:{roles:['powerhouse-admin']}}),false);
  assert.equal(isPowerhouseAdmin({app_metadata:{roles:['powerhouse-admin']}}),false);
  const handler=readFileSync('netlify/functions/powerhouse-control-plane.mjs','utf8');
  assert.match(handler,/isPowerhouseAdmin\(user\)/);
  assert.match(handler,/if\(!hasAdminRole\(user\)\)return json\(\{error:'FORBIDDEN'\},403\)/);
  assert.ok(handler.indexOf('if(!hasAdminRole(user))')<handler.indexOf('readPowerhouseIntegrationReadback('));
  assert.doesNotMatch(handler,/user_metadata\?\.roles/);
});

test('existing deploySucceeded signed synthetic identities prove original admin source and 403/401 denial, clean both',async()=>{
  const deleted=[],calls=[],users={};
  const synthetic={
    createUser:async input=>{
      const slot=input.email.includes('-a-')?'a':'b';
      const uid='proof-user-'+slot;
      users[uid]={id:uid,appMetadata:input.data.app_metadata};
      return {id:uid};
    },
    getUser:async uid=>users[uid],
    updateUser:async()=>{throw Error('UNEXPECTED_UPDATE')},
    deleteUser:async uid=>{deleted.push(uid);delete users[uid]}
  };
  const signed={};
  const fetchImpl=async(url,opts)=>{
    const path=new URL(url).pathname;
    calls.push({path,authorized:!!opts.headers?.authorization});
    if(path.endsWith('/token')){
      const email=new URLSearchParams(opts.body).get('username');
      const slot=email.includes('-a-')?'a':'b';
      const uid='proof-user-'+slot;
      signed[slot]=jwt({sub:uid,app_metadata:users[uid].appMetadata});
      return {ok:true,status:200,json:async()=>({access_token:signed[slot]})};
    }
    const slot=opts.headers.authorization===`Bearer ${signed.a}`?'a':
      opts.headers.authorization===`Bearer ${signed.b}`?'b':'anonymous';
    if(path.endsWith('/api/portal-ondernemersdata'))return {ok:true,status:200,json:async()=>({
      scope:{authenticatedTenant:'proof:'+id+':'+slot},
      sources:[],publications:[],signals:[],intelligence:{},
      stats:{generatedAt:'2026-11-15T12:00:00Z'}
    })};
    if(path.endsWith('/api/powerhouse-one-loop-assurance')){
      if(slot==='anonymous')return {ok:false,status:401,json:async()=>({error:'UNAUTHENTICATED'})};
      if(slot==='b')return {ok:false,status:403,json:async()=>({error:'POWERHOUSE_ADMIN_REQUIRED'})};
      return {ok:true,status:200,json:async()=>({
        contract:'one-brain-original-loop-assurance-readback-v1',
        status:'READBACK_COMPLETE',source:'public.powerhouse_loop_assurance_state_v1',
        counts:{total:15,green:8,amber:1,red:6},overallStatus:'RED',
        loops:Array.from({length:15},(_,i)=>({key:'original-'+i,status:i<6?'RED':'GREEN'}))
      })};
    }
    if(path.endsWith('/api/powerhouse-control-plane')){
      if(slot==='anonymous')return {ok:false,status:401,json:async()=>({error:'UNAUTHORIZED'})};
      if(slot==='b')return {ok:false,status:403,json:async()=>({error:'FORBIDDEN'})};
      return {ok:true,status:200,
        headers:{get:key=>key==='x-bg-innovation-audit-scope'?'FULL_LAST_7D':null},
        json:async()=>audit()};
    }
    throw Error('UNEXPECTED_URL_PATH:'+path);
  };
  const proof=await runPortalAuthenticatedProductionProof({
    deploy,identityAdmin:synthetic,fetchImpl,
    getIdentityConfigFn:()=>({url:'https://bedrijfsgeheugen.netlify.app/.netlify/identity'}),
    randomPassword:()=> 'x'.repeat(40),probeInnovationAudit:true,
    now:()=> '2026-11-15T12:00:05.000Z'
  });
  assert.equal(proof.status,'PROVEN');
  assert.equal(proof.innovation_audit_proof,'PROVEN');
  assert.equal(proof.innovation_audit_admin_verified,true);
  assert.equal(proof.innovation_audit_nonadmin_denied,true);
  assert.equal(proof.innovation_audit_unauthenticated_denied,true);
  assert.deepEqual(proof.innovation_audit_counts,{
    scope:'FULL_LAST_7D',total:164,historical_writer_backed:164,
    unsupported:0,missing_actions:0,currently_not_done:1,
    unlogged_execution_attempts:0,internal_source_gap_present:false,
    external_provider_proven:false,business_outcome_proven:false
  });
  assert.equal(proof.innovation_audit_failure_code,null);
  assert.equal(assertOriginalInnovationProductionReleaseProof(proof).events,164);
  assert.equal(assertOriginalInnovationProductionReleaseProof(proof).delivery_proven,false);
  assert.equal(proof.one_loop_assurance_proof,'PROVEN');
  assert.equal(proof.synthetic_user_cleanup,'DELETED');
  assert.deepEqual(deleted,['proof-user-b','proof-user-a']);
  assert.equal(Object.keys(users).length,0);
  assert.equal(calls.filter(x=>x.path.endsWith('/api/powerhouse-control-plane')).length,3);
  assert.doesNotMatch(JSON.stringify(proof),/proof-user|@proof\.invalid|access_token/);
});

test('wrong admin counts and missing 403 fail closed without falsifying original two-tenant proof',async()=>{
  const a=projectOriginalInnovationAdminProof(audit({state:'SOURCE_EXECUTION_GAP'}),'FULL_LAST_7D');
  assert.equal(a,null,'unsupported state cannot be green when unsupported count is zero');
  const original=readFileSync('netlify/functions/portal-authenticated-production-proof.mjs','utf8');
  assert.match(original,/probeInnovationAudit:true/);
  assert.doesNotMatch(original,/new (?:scheduler|queue|worker)/i);
});

test('canonical original release gate rejects fake-green auth, wrong cardinality and leaked outcomes',()=>{
  const proof={
    innovation_audit_proof:'PROVEN',innovation_audit_admin_verified:true,
    innovation_audit_nonadmin_denied:true,
    innovation_audit_unauthenticated_denied:true,
    innovation_audit_failure_code:null,synthetic_user_cleanup:'DELETED',
    innovation_audit_counts:{
      scope:'FULL_LAST_7D',total:164,historical_writer_backed:164,
      unsupported:0,missing_actions:0,currently_not_done:1,
      unlogged_execution_attempts:0,internal_source_gap_present:false,
      external_provider_proven:false,business_outcome_proven:false
    }
  };
  assert.equal(assertOriginalInnovationProductionReleaseProof(proof).events,164);
  for(const wrong of [
    {...proof,innovation_audit_proof:'UNVERIFIED'},
    {...proof,innovation_audit_nonadmin_denied:false},
    {...proof,innovation_audit_unauthenticated_denied:false},
    {...proof,synthetic_user_cleanup:'FAILED'},
    {...proof,innovation_audit_counts:{...proof.innovation_audit_counts,total:165}},
    {...proof,innovation_audit_counts:{...proof.innovation_audit_counts,
      external_provider_proven:true}},
    {...proof,innovation_audit_counts:{...proof.innovation_audit_counts,
      currently_not_done:165}}
  ])assert.throws(()=>assertOriginalInnovationProductionReleaseProof(wrong));
});

test('existing protected production verifier requires exact same signed admin proof only for affected routes',()=>{
  const workflow=readFileSync('.github/workflows/production-release-readback.yml','utf8');
  const event=readFileSync('netlify/functions/portal-authenticated-production-proof.mjs','utf8');
  assert.match(workflow,/innovation_admin_proof_required/);
  assert.match(workflow,/platform\/portal\/powerhouse-existing-integration-read-model\.mjs/);
  assert.match(workflow,/netlify\/functions\/powerhouse-control-plane\.mjs/);
  assert.match(workflow,/assertOriginalInnovationProductionReleaseProof\(proof\)/);
  assert.match(workflow,/INNOVATION_ADMIN_PROOF_REQUIRED/);
  assert.match(workflow,/original_agent_consumer_ack_proven:false/);
  assert.match(event,/probeInnovationAudit:true/);
  assert.match(event,/deploySucceeded/);
  assert.match(event,/portalAuthProofKey\(deploy\.commitRef\)/);
});

test('source-only signed admin proof reports one missing reexecution as RED without dropping valid earlier event or claiming delivery',()=>{
  const body=audit({state:'CURRENT_EXECUTION_EVENT_MISSING',
    currentExecutionWithoutEventSample:1});
  const result=projectOriginalInnovationAdminProof(body,'FULL_LAST_7D');
  assert.equal(result.historical_writer_backed,164);
  assert.equal(result.unlogged_execution_attempts,1);
  assert.equal(result.internal_source_gap_present,true);
  assert.equal(result.external_provider_proven,false);
  assert.equal(result.business_outcome_proven,false);
  const proof={innovation_audit_proof:'PROVEN',innovation_audit_admin_verified:true,
    innovation_audit_nonadmin_denied:true,innovation_audit_unauthenticated_denied:true,
    innovation_audit_failure_code:null,synthetic_user_cleanup:'DELETED',
    innovation_audit_counts:result};
  const v=assertOriginalInnovationProductionReleaseProof(proof);
  assert.equal(v.unlogged_execution_attempts,1);
  assert.equal(v.internal_source_gap_present,true);
  assert.equal(v.delivery_proven,false);
  assert.equal(projectOriginalInnovationAdminProof(audit({
    state:'HISTORICAL_WRITER_ACTION_JOINED_PROVIDER_UNVERIFIED',
    currentExecutionWithoutEventSample:1
  }),'FULL_LAST_7D'),null,'source-only state must not be green while new attempt is missing');
  assert.equal(projectOriginalInnovationAdminProof(audit({
    state:'CURRENT_EXECUTION_EVENT_MISSING',currentExecutionWithoutEventSample:0
  }),'FULL_LAST_7D'),null,'cannot invent a missing event state');
  assert.equal(projectOriginalInnovationAdminProof(audit({
    state:'CURRENT_EXECUTION_EVENT_MISSING',currentExecutionWithoutEventSample:165
  }),'FULL_LAST_7D'),null,'unlogged count bounded by validated historical events');
});
