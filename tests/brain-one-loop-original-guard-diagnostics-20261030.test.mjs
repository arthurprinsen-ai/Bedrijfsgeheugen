import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeOneLoopAssurance} from '../brain/observability/one-loop-assurance-readback.mjs';
import {projectOriginalGuardDiagnostics,loadOneLoopAssuranceWithDiagnostics}
 from '../brain/observability/one-loop-guard-diagnostics.mjs';

const names=['content-closed-loop','daily-compound-learning','data-spine-watchdog','full-cycle-production-proof',
 'one-brain-reconcile','revenue-flywheel','autonomous-outreach','execution-resilience','external-intelligence-universe',
 'mira-problem-loop','portal-visual-density','self-improvement-layer','seo-opportunity-resolver',
 'signal-taxonomy-self-heal','source-backed-outbound'];
const at='2026-10-30T21:00:00Z';
const rows=()=>names.map((loop_key,i)=>({loop_key,status:i<6?'RED':i===6?'AMBER':'GREEN',
 checked_at:'2026-10-30T20:53:00Z',fresh_stage_count:i===6?6:8,required_stage_count:8,
 missing_stages:i===6?['action','readback']:[],evidence:{guard_pass:i<6?false:null}}));
const assurance=()=>summarizeOneLoopAssurance(rows(),{observedAt:at});
const guard=(loop_key,evidence)=>({loop_key,stage:'guard',observed_at:'2026-10-30T20:53:00Z',evidence});
const receipts=()=>[
 guard('content-closed-loop',{pass:false,state:{status:'BLOCKED',result:JSON.stringify({
   hardBoundaries:[{channel:'email_newsletter',reason:'NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR'}],
   obligations:[{last_error:'GLOBAL_POST_DUPLICATE_BLOCKED:SECRET_TOKEN=do-not-leak'},
     {last_error:'SILENT_PUBLICATION_FAILURE'}],
   steps:[{error:'INSTAGRAM_DAILY_WINNER_REQUIRED'}]})}}),
 guard('daily-compound-learning',{pass:false,runtime_evidence:{control:{forecast_resolution_debt:1867}}}),
 guard('data-spine-watchdog',{pass:false,unhealthy_sources:2}),
 guard('full-cycle-production-proof',{pass:false,proof:{healthy:false}}),
 guard('one-brain-reconcile',{pass:false,health:{current_runtime_errors:4,evidence_sparse_required_layers:2,content_loop_state:'BLOCKED'}}),
 guard('revenue-flywheel',{pass:false,health:{calibration_gap:true,due_uncalibrated_forecasts:1867,realized_revenue_eur:0}}),
 guard('autonomous-outreach',{fail_closed:true})
];
test('reasons come only from original guard receipts and preserve 8/1/6 actual status',()=>{
 const a=assurance();assert.deepEqual(a.counts,{total:15,green:8,amber:1,red:6});
 const p=projectOriginalGuardDiagnostics(a,receipts(),{observedAt:at});
 assert.equal(p.contract,'one-brain-original-guard-diagnostics-v1');
 assert.equal(p.status,'READBACK_COMPLETE');
 assert.equal(p.cases.length,7);
 assert.equal(p.allGreen,false);
 const codes=k=>p.cases.find(x=>x.key===k).reasons.map(x=>x.code);
 assert.ok(codes('content-closed-loop').includes('GLOBAL_POST_DUPLICATE_BLOCKED'));
 assert.ok(codes('content-closed-loop').includes('NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR'));
 assert.ok(codes('data-spine-watchdog').includes('UNHEALTHY_DATA_SOURCES'));
 assert.ok(codes('one-brain-reconcile').includes('RUNTIME_ERRORS_OPEN'));
 assert.ok(codes('revenue-flywheel').includes('CALIBRATION_DEBT_OPEN'));
 assert.ok(codes('daily-compound-learning').includes('CALIBRATION_DEBT_OPEN'));
 assert.ok(codes('autonomous-outreach').includes('OUTREACH_ACTION_READBACK_DUE'));
 assert.doesNotMatch(JSON.stringify(p),/SECRET_TOKEN|email_newsletter|service_role|do-not-leak/i);
 assert.deepEqual(a.counts,{total:15,green:8,amber:1,red:6});
});
test('malformed, stale, truncated, missing receipts fail closed without inventing outcomes',()=>{
 const a=assurance();
 assert.equal(projectOriginalGuardDiagnostics(a,null,{observedAt:at}).status,'UNAVAILABLE');
 assert.equal(projectOriginalGuardDiagnostics(a,Array(21).fill({}),{observedAt:at}).status,'UNAVAILABLE');
 const old=receipts();old[0].observed_at='2026-10-29T12:00:00Z';
 const p=projectOriginalGuardDiagnostics(a,old,{observedAt:at});
 assert.equal(p.cases.find(x=>x.key==='content-closed-loop').guardEvidence,'NOT_READ_BACK');
 assert.deepEqual(p.cases.find(x=>x.key==='content-closed-loop').reasons.map(x=>x.code),
  ['ORIGINAL_GUARD_FAILED_REASON_UNAVAILABLE']);
 const bad=receipts();bad[0].evidence.state.result='[TOKEN_REVOKED PRIVATE_PAYLOAD]';
 assert.doesNotMatch(JSON.stringify(projectOriginalGuardDiagnostics(a,bad,{observedAt:at})),/TOKEN_REVOKED PRIVATE_PAYLOAD/);
 const repeated=receipts();repeated.push(repeated[0]);
 assert.equal(projectOriginalGuardDiagnostics(a,repeated,{observedAt:at}).status,'UNAVAILABLE');
});
test('same original Supabase source receives only two protected, read-only queries',async()=>{
 const calls=[];
 const loaded=await loadOneLoopAssuranceWithDiagnostics({
  baseUrl:'https://example.supabase.co',key:'test-placeholder',now:()=>at,
  fetchImpl:async(url,options)=>{
   const u=new URL(url);calls.push({path:u.pathname,method:options.method});
   if(u.pathname.endsWith('/powerhouse_loop_assurance_state_v1'))
    return {ok:true,status:200,json:async()=>rows()};
   if(u.pathname.endsWith('/powerhouse_loop_assurance_receipts_v1')){
    assert.equal(u.searchParams.get('stage'),'eq.guard');
    assert.equal(u.searchParams.get('limit'),'20');
    return {ok:true,status:200,json:async()=>receipts()};
   }
   throw Error('unexpected source');
  }
 });
 assert.equal(loaded.status,'READBACK_COMPLETE');
 assert.equal(loaded.guardDiagnostics.status,'READBACK_COMPLETE');
 assert.equal(calls.length,2);
 assert.ok(calls.every(x=>x.method==='GET'));
 assert.deepEqual(loaded.counts,{total:15,green:8,amber:1,red:6});
});
test('guard provider failure preserves original truth and displays diagnostics UNAVAILABLE',async()=>{
 const loaded=await loadOneLoopAssuranceWithDiagnostics({
  baseUrl:'https://example.supabase.co',key:'test-placeholder',now:()=>at,
  fetchImpl:async(url)=>url.includes('assurance_state_v1')?
   {ok:true,status:200,json:async()=>rows()}:{ok:false,status:503}
 });
 assert.equal(loaded.status,'READBACK_COMPLETE');
 assert.equal(loaded.guardDiagnostics.status,'UNAVAILABLE');
 assert.equal(loaded.guardDiagnostics.reason,'ORIGINAL_GUARD_PROVIDER_503');
 assert.equal(loaded.overallStatus,'RED');
});
test('canonical tenant-gated portal and CRO views display bounded action, never a second writer',async()=>{
 const [api,cro,portal,other]=await Promise.all([
  readFile(new URL('../netlify/functions/powerhouse-one-loop-assurance.mjs',import.meta.url),'utf8'),
  readFile(new URL('../netlify/functions/powerhouse-cro-other-data.mjs',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/modules/andere-data.js',import.meta.url),'utf8')
 ]);
 for(const source of [api,cro])assert.match(source,/loadOneLoopAssuranceWithDiagnostics/);
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/resolveIdentityTenant\(user\)/);
 assert.match(portal,/caseInfo.reasons/);
 assert.match(other,/guardCauses.get\(row.key\)/);
 assert.doesNotMatch(api,/\.insert\(|\.update\(|\.upsert\(/);
});
