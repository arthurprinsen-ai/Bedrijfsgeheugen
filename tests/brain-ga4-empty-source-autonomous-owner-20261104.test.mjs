import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../supabase/functions/bg-analytics-sync-composio/index.ts',import.meta.url),'utf8');
const testSection=code.slice(code.indexOf('// HTTP200 with zero returned rows'),code.indexOf("  const headers=['date'"));
test('historical GA4 HTTP200 and zero provider rows never create a fake success receipt',()=>{
 assert.ok(testSection.includes('if(rows.length===0)'));
 assert.match(testSection,/status:consentLimited\?'CONSENT_LIMITED':'NO_SOURCE_DATA'/);
 assert.match(testSection,/status:consentLimited\?'privacy_limited':'error',fout:reason/);
 assert.match(testSection,/await bewijs\(false,result,consentLimited\?'CONSENT_BOUNDARY':'EMPTY_SOURCE'\)/);
 assert.match(testSection,/return json\(result,consentLimited\?200:503\)/);
 assert.ok(code.indexOf("if(rows.length===0)")<code.indexOf("  const headers=['date'"));
 assert.ok(testSection.includes('provider_report_rows:0'));
});
test('the original owner verifies an independent GA4 totals report without guessing traffic or bypassing consent',()=>{
 assert.match(code,/async function originalGa4AggregateProbe/);
 assert.match(code,/name:'sessions'/);
 assert.match(code,/name:'eventCount'/);
 assert.match(testSection,/aggregate_probe:aggregate/);
 assert.match(testSection,/GA4_DIMENSION_QUERY_EMPTY_WITH_NONZERO_TOTAL/);
 assert.match(testSection,/actual_site_sessions:'UNKNOWN_NOT_INFERRED'/);
});
test('same original analytics function creates exactly one canonical ongoing recovery obligation per incident',()=>{
 assert.match(code,/db\.rpc\('brain_create_obligation',identity\)/);
 assert.match(code,/p_obligation_type:'MEASUREMENT_REPAIR'/);
 assert.match(code,/p_capability_id:'powerhouse-data-intake-learning-spine-v1'/);
 assert.match(code,/p_business_entity:'ga4-analytics'/);
 assert.match(code,/p_business_period:'ongoing'/);
 assert.match(code,/p_business_timezone:'Europe\/Amsterdam'/);
 assert.match(code,/p_payload_sha256:await sha256\('ga4-analytics\|empty-success\|stale-source\|recovery-v1'\)/);
 assert.match(code,/p_change_id:fingerprint/);
});
test('original Brain repair uses atomic compare-and-swap and preserves the running owner',()=>{
 assert.match(code,/db\.rpc\('brain_transition_obligation'/);
 assert.match(code,/p_expected_version:ob.version/);
 assert.match(code,/historical=\(ob\.evidence&&typeof ob\.evidence==='object'/);
 assert.match(code,/\.\.\.historical,status:'REPAIR_REQUIRED',latest_observation:report/);
 assert.match(code,/\['RUNNING','BLOCKED'\]\.includes\(ob.state\)\?ob.state:'READY'/);
 assert.match(code,/GA4_CANONICAL_REPAIR_CAS_FAILED/);
 assert.match(code,/identity\.p_business_period=day/);
 assert.match(code,/\['FULFILLED','CANCELLED','BREACHED'\]\.includes\(ob.state\)/);
});
test('the original scheduler and normal nonempty provider route are preserved, with no side-effect replay',()=>{
 assert.match(code,/const BRON='bg-analytics-sync-composio'/);
 assert.match(code,/const headers=\['date','pagePath','sessionCampaignName','sessions','activeUsers','eventCount'\]/);
 assert.match(code,/const status=unmatched>0\?'PARTIAL':'IMPORTED'/);
 assert.match(code,/const existing=|data:existing/);
 assert.match(code,/GA4_CONSENT_LIMITED_NO_SOURCE_ROWS/);
 assert.doesNotMatch(testSection,/\bbg-post-import\b/);
 assert.doesNotMatch(testSection,/status:'ok'/);
});
test('empty provider evidence is recorded separately and not silently accepted as a duplicate batch',()=>{
 assert.match(testSection,/writeRuntime\(db,`ga4-source-empty:\$\{day\}:\$\{sourceRoute\}`,consentLimited\?'observed':'error',observation,'ga4_source_empty_observed'\)/);
 assert.match(code,/eventType='ga4_failover_observed'/);
 assert.match(code,/event_type:eventType/);
 assert.match(testSection,/originalGa4EmptyRepair\(db,day,sourceRoute,observation\)/);
 assert.ok(testSection.indexOf('originalGa4EmptyRepair')<testSection.indexOf('await bewijs(false,result'));
});

test('consent-limited GA4 is explicitly classified, without treating private first-party metrics as Google traffic',()=>{
 assert.match(testSection,/consentedHumanEvidence===false && aggregate!==null && !totalsPositive/);
 assert.match(testSection,/GA4_CONSENT_LIMITED_NO_SOURCE_ROWS/);
 assert.match(testSection,/status:consentLimited\?'privacy_limited':'error'/);
 assert.match(testSection,/source_data_available:false/);
 assert.match(testSection,/NO_CONSENT_BYPASS_NO_FORCED_GA4_TRACKING/);
 assert.match(testSection,/recommended_existing_source:'privacy-minimized bg_interacties for CRO only'/);
 assert.match(testSection,/consentLimited\?200:503/);
 assert.match(testSection,/\.eq\('toestemming',true\)\.eq\('is_robot',false\)/);
});
test('when consented native signals exist but GA4 is empty, original source repair remains non-successful',()=>{
 assert.match(testSection,/GA4_ZERO_DESPITE_CONSENTED_SITE_EVENTS/);
 assert.match(testSection,/GA4_DIMENSION_QUERY_EMPTY_WITH_NONZERO_TOTAL/);
 assert.match(testSection,/GA4_EMPTY_SOURCE_INDEPENDENT_EVIDENCE_DUE/);
 assert.match(testSection,/consent_evidence_error/);
 assert.match(testSection,/await bewijs\(false,result,/);
});

test('original GA4 repair safely rereads a concurrent CAS version before bounded retry',async()=>{
 const section=code.slice(code.indexOf('async function originalGa4EmptyRepair'),code.indexOf('async function originalGa4AggregateProbe'));
 const js=section.replace('db:any','db').replace('day:string','day').replace('sourceRoute:string','sourceRoute').replace('report:any','report');
 const repair=new Function('sha256',js+';return originalGa4EmptyRepair;')(async()=> 'a'.repeat(64));
 let version=3,transitions=0,reads=0,seen=null;
 const db={
  rpc:async(name,args)=>{
   if(name==='brain_create_obligation')return {data:{id:'same-canonical-id',state:'RUNNING',version:3,evidence:{original:true}},error:null};
   assert.equal(name,'brain_transition_obligation'); transitions++;
   if(transitions===1){assert.equal(args.p_expected_version,3);version=4;return {data:null,error:{message:'STATE_VERSION_CONFLICT'}};}
   assert.equal(args.p_expected_version,4);seen=args.p_evidence;
   return {data:{id:'same-canonical-id',state:args.p_state,version:5},error:null};
  },
  from:table=>{assert.equal(table,'brain_obligations');return {select:()=>({eq:(key,value)=>{assert.equal(key,'id');assert.equal(value,'same-canonical-id');return {single:async()=>{reads++;return {data:{id:value,state:'RUNNING',version,evidence:{original:true,concurrent_write:'preserved'}},error:null};}};}})};}
 };
 const out=await repair(db,'2026-11-04','google-analytics-data-api',{provider_rows:0});
 assert.equal(out.cas_retries,1);assert.equal(out.obligation_version,5);
 assert.equal(reads,1);assert.equal(transitions,2);
 assert.equal(seen.original,true);assert.equal(seen.concurrent_write,'preserved');
 assert.equal(seen.historical_zero_rows_not_traffic_proof,true);
});
test('GA4 CAS retries never bypass other failures or reopen terminal obligations',async()=>{
 const section=code.slice(code.indexOf('async function originalGa4EmptyRepair'),code.indexOf('async function originalGa4AggregateProbe'));
 const js=section.replace('db:any','db').replace('day:string','day').replace('sourceRoute:string','sourceRoute').replace('report:any','report');
 const repair=new Function('sha256',js+';return originalGa4EmptyRepair;')(async()=> 'a'.repeat(64));
 let retryRead=0;
 const denied={
  rpc:async(name)=>name==='brain_create_obligation'?{data:{id:'x',state:'READY',version:1,evidence:{}},error:null}:{data:null,error:{message:'PERMISSION_DENIED'}},
  from:()=>{retryRead++;throw Error('unreachable');}
 };
 await assert.rejects(()=>repair(denied,'2026-11-04','api',{}),/GA4_CANONICAL_REPAIR_CAS_FAILED:PERMISSION_DENIED/);
 assert.equal(retryRead,0);
 let created=0,transitions=0;
 const terminal={
  rpc:async(name,args)=>{
   if(name==='brain_create_obligation'){created++;return {data:{id:created===1?'ongoing':'daily',state:'FULFILLED',version:7,evidence:{verified:true}},error:null};}
   transitions++;throw Error('must not reopen');
  }
 };
 const out=await repair(terminal,'2026-11-04','api',{provider_rows:0});
 assert.equal(created,2);assert.equal(transitions,0);assert.equal(out.terminal_protected,true);
});
 
test('canonical GA4 Edge production declaration and original cron token guard are required together',()=>{
 const config=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
 assert.match(config,/\[functions\.bg-analytics-sync-composio\]\s*enabled = true\s*verify_jwt = false\s*entrypoint = "\.\/functions\/bg-analytics-sync-composio\/index\.ts"/);
 const start=code.indexOf('Deno.serve(async(req:Request)=>');
 const auth=code.indexOf("req.headers.get('x-powerhouse-token')",start);
 const compare=code.indexOf('callerToken!==schedulerSecret',start);
 const vault=code.indexOf("p_naam:'powerhouse_daily_scheduler_token'",start);
 const sourceCall=code.indexOf("p_naam:'GOOGLE_SERVICE_ACCOUNT'",start);
 const provider=code.indexOf('rows=await directGA4',start);
 assert.ok(start>=0&&auth>start&&vault>start&&compare>auth);
 assert.ok(compare<sourceCall&&compare<provider);
 assert.match(code.slice(start,provider),/return json\(\{ok:false,error:'UNAUTHORIZED'\},401\)/);
});
