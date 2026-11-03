import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeOneLoopAssurance} from '../brain/observability/one-loop-assurance-readback.mjs';
import {projectOriginalGuardDiagnostics,loadOneLoopAssuranceWithDiagnostics}
 from '../brain/observability/one-loop-guard-diagnostics.mjs';

const at='2026-10-31T08:46:00Z';
const other=['execution-resilience','external-intelligence-universe','mira-problem-loop',
 'portal-visual-density','self-improvement-layer','seo-opportunity-resolver',
 'signal-taxonomy-self-heal','source-backed-outbound'];
const specs=[
 ['autonomous-outreach','AMBER',['action','readback']],
 ['content-closed-loop','AMBER',['action','guard','learning','measurement','outcome','readback']],
 ['data-spine-watchdog','AMBER',['action','guard','learning','outcome']],
 ['daily-compound-learning','RED',[]],
 ['full-cycle-production-proof','RED',[]],
 ['one-brain-reconcile','RED',[]],
 ['revenue-flywheel','RED',[]],
 ...other.map(key=>[key,'GREEN',[]])
];
const rows=()=>specs.map(([loop_key,status,missing_stages])=>({
 loop_key,status,missing_stages,
 required_stage_count:8,fresh_stage_count:8-missing_stages.length,
 checked_at:'2026-10-31T08:45:03Z',
 evidence:{guard_pass:status==='RED'?false:status==='GREEN'?true:null}
}));
const source=()=>summarizeOneLoopAssurance(rows(),{observedAt:at});
const receipt=(loop_key,evidence)=>({loop_key,stage:'guard',observed_at:'2026-10-31T08:44:20Z',evidence});
const receipts=()=>[
 receipt('daily-compound-learning',{pass:false,runtime_evidence:{control:{forecast_resolution_debt:2213}}}),
 receipt('full-cycle-production-proof',{pass:false,proof:{healthy:false}}),
 receipt('one-brain-reconcile',{pass:false,health:{current_runtime_errors:3,evidence_sparse_required_layers:2}}),
 receipt('revenue-flywheel',{pass:false,health:{calibration_gap:true,due_uncalibrated_forecasts:2213,realized_revenue_eur:0}})
];
test('actual 31 October 8 green/3 amber/4 red: assign each missing stage to its ORIGINAL owner',()=>{
 const a=source();assert.equal(a.status,'READBACK_COMPLETE');
 assert.deepEqual(a.counts,{total:15,green:8,amber:3,red:4});
 const report=projectOriginalGuardDiagnostics(a,receipts(),{observedAt:at});
 assert.equal(report.status,'READBACK_COMPLETE');
 const code=key=>report.cases.find(x=>x.key===key).reasons[0].code;
 assert.equal(code('autonomous-outreach'),'OUTREACH_ACTION_READBACK_DUE');
 assert.equal(code('content-closed-loop'),'CONTENT_PUBLICATION_STAGE_EVIDENCE_DUE');
 assert.equal(code('data-spine-watchdog'),'DATA_SPINE_STAGE_EVIDENCE_DUE');
 assert.equal(code('daily-compound-learning'),'CALIBRATION_DEBT_OPEN');
 assert.equal(code('full-cycle-production-proof'),'FULL_CYCLE_SOURCE_UNHEALTHY');
 assert.equal(code('one-brain-reconcile'),'RUNTIME_ERRORS_OPEN');
 assert.equal(code('revenue-flywheel'),'CALIBRATION_DEBT_OPEN');
 for(const owner of ['autonomous-outreach','content-closed-loop','data-spine-watchdog']){
  const c=report.cases.find(x=>x.key===owner);
  assert.equal(c.guardEvidence,'NOT_READ_BACK');
  assert.equal(c.verifiedOutcome,false);
  assert.equal(c.source,null);
 }
 assert.deepEqual(a.counts,{total:15,green:8,amber:3,red:4});
 assert.equal(report.allGreen,false);
});
test('fallback on novel amber loop is generic, never falsifies outreach ownership',()=>{
 const a=source();
 const changed=structuredClone(a);
 const row=changed.loops.find(x=>x.key==='external-intelligence-universe');
 row.status='AMBER';row.missingStages=['decision'];row.freshStages=7;
 const report=projectOriginalGuardDiagnostics(changed,receipts(),{observedAt:at});
 const novel=report.cases.find(x=>x.key==='external-intelligence-universe');
 assert.equal(novel.reasons[0].code,'ORIGINAL_LOOP_STAGE_EVIDENCE_DUE');
 assert.doesNotMatch(novel.reasons[0].nextAction,/outreach|verzending/i);
});
test('amber with no missing stage still never inherits outreach action',()=>{
 const a=source(),changed=structuredClone(a);
 const row=changed.loops.find(x=>x.key==='external-intelligence-universe');
 row.status='AMBER';row.missingStages=[];row.freshStages=8;
 const report=projectOriginalGuardDiagnostics(changed,receipts(),{observedAt:at});
 assert.equal(report.cases.find(x=>x.key===row.key).reasons[0].code,'ORIGINAL_AMBER_EVIDENCE_DUE');
});
test('stale guard receipt cannot shadow missing stage truth',()=>{
 const a=source(),value=receipts();
 value.push(receipt('content-closed-loop',{pass:false,state:{status:'BLOCKED',result:JSON.stringify({
  obligations:[{last_error:'GLOBAL_POST_DUPLICATE_BLOCKED:TOKEN=private'}]
 })}}));
 value[value.length-1].observed_at='2026-10-30T08:44:20Z';
 const report=projectOriginalGuardDiagnostics(a,value,{observedAt:at});
 const c=report.cases.find(x=>x.key==='content-closed-loop');
 assert.equal(c.reasons[0].code,'CONTENT_PUBLICATION_STAGE_EVIDENCE_DUE');
 assert.equal(c.guardEvidence,'NOT_READ_BACK');
 assert.doesNotMatch(JSON.stringify(report),/TOKEN=private/);
});
test('original two read-only source projections and existing portal views remain unchanged',async()=>{
 const calls=[];
 const a=await loadOneLoopAssuranceWithDiagnostics({baseUrl:'https://example.supabase.co',
  key:'test-placeholder',now:()=>at,fetchImpl:async(url,options)=>{
   calls.push({url,method:options.method});
   if(url.includes('assurance_state_v1'))return {ok:true,json:async()=>rows()};
   if(url.includes('assurance_receipts_v1'))return {ok:true,json:async()=>receipts()};
   throw Error('unexpected path');
  }});
 assert.deepEqual(a.counts,{total:15,green:8,amber:3,red:4});
 assert.equal(a.guardDiagnostics.cases.length,7);
 assert.equal(calls.length,2);
 assert.ok(calls.every(x=>x.method==='GET'));
 const [portal,cro,api]=await Promise.all([
  readFile(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/modules/andere-data.js',import.meta.url),'utf8'),
  readFile(new URL('../netlify/functions/powerhouse-one-loop-assurance.mjs',import.meta.url),'utf8')
 ]);
 assert.match(portal,/caseInfo.reasons/);
 assert.match(cro,/guardCauses.get\(row.key\)/);
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/resolveIdentityTenant\(user\)/);
 assert.doesNotMatch(api,/\.insert\(|\.upsert\(|\.update\(/);
});
