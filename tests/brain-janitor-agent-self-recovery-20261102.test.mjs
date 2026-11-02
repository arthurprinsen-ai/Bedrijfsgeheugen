import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergedSuccessorIsProven,verifyMergedSuccessor,classifyCurrentJanitor,writeBrainOccurrence,FINGERPRINT}
 from '../tools/delivery/janitor-incident-agent.mjs';

const predecessor=2225, obligation='seo-clean-url-bedrijf-overdraagbaar-maken-v1';
const successor={number:2353,state:'closed',merged:true,merged_at:'2026-09-19T12:09:26Z',
 body:'Obligation-ID: '+obligation+'\nSupersedes: 2225'};
const repo='arthurprinsen-ai/Bedrijfsgeheugen';
test('agent proves historic merged successor #2353 absent from first-100 closed PR snapshot',async()=>{
 const v=await verifyMergedSuccessor({repo,predecessor,obligation,
   search:async()=>({items:[{number:2353}],incomplete_results:false}),
   readPr:async()=>successor});
 assert.equal(v.status,'PROVEN_MERGED_SUCCESSOR');
 assert.equal(v.successor_number,2353);
 assert.equal(v.proven,true);assert.equal(v.safe_to_reopen,false);
});
test('proof requires exact obligation, specific predecessor, verified merge and closed state',()=>{
 assert.equal(mergedSuccessorIsProven(successor,{predecessor,obligation}),true);
 for(const pr of [
  {...successor,body:'Obligation-ID: other\nSupersedes: 2225'},
  {...successor,body:'Obligation-ID: '+obligation},
  {...successor,merged:false},
  {...successor,state:'open'},
  {...successor,merged_at:null}
 ])assert.equal(mergedSuccessorIsProven(pr,{predecessor,obligation}),false);
});
test('absence, incomplete index, API outage, and misleading search hit never authorize reopen',async()=>{
 for(const candidate of [
  {search:async()=>({items:[]}),readPr:async()=>successor},
  {search:async()=>({items:[],incomplete_results:true}),readPr:async()=>successor},
  {search:async()=>({items:[{number:2353}]}),readPr:async()=>({...successor,merged:false})},
  {search:async()=>{throw Error('403');},readPr:async()=>successor}
 ]){
  const v=await verifyMergedSuccessor({repo,predecessor,obligation,...candidate});
  assert.equal(v.proven,false);assert.equal(v.safe_to_reopen,false);
 }
});
test('failed reconciliation is incident even if later telemetry and artifact upload succeed',()=>{
 const v=classifyCurrentJanitor({cleanupOutcome:'failure',readbackOutcome:'skipped',
   runId:41342975119,mainSha:'eedc3f8b380cd1e0c986cc0d0ea98854a48813e8'});
 assert.equal(v.status,'INCIDENT_OPEN_STEP_FAILURE');
 assert.deepEqual(v.failed_steps,['cleanup']);
 assert.equal(v.independent_runtime_repair_proven,false);
 assert.equal(v.global_green,false);assert.equal(v.fingerprint,FINGERPRINT);
});
test('successful steps allow only run-local proof, not systemwide GREEN',()=>{
 const v=classifyCurrentJanitor({cleanupOutcome:'success',readbackOutcome:'success',runId:42,
   mainSha:'88b53ef8d5d0257bfadc09fe6141bba6e3198708',
   actions:[{type:'TERMINAL_LEASE_SATISFIED_BY_MERGED_SUCCESSOR',
     pr_number:2225,successor_number:2353,evidence:'DIRECT_READBACK'}]});
 assert.equal(v.status,'JANITOR_STEPS_VERIFIED_SAME_RUN');
 assert.equal(v.global_green,false);
 assert.equal(v.verified_merged_successors[0].successor,2353);
});
test('same original schedule invokes agent observer and archives evidence',()=>{
 const src=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 assert.equal((src.match(/cron: '17 \* \* \* \*'/g)||[]).length,1);
 assert.match(src,/id: janitor_cleanup_reconcile/);
 assert.match(src,/id: janitor_cleanup_readback/);
 assert.match(src,/janitor-incident-agent\.mjs --verify-successor/);
 assert.match(src,/janitor-incident-agent\.mjs --observe/);
 assert.match(src,/JANITOR_CLEANUP_OUTCOME:/);
 assert.match(src,/JANITOR_READBACK_OUTCOME:/);
 assert.match(src,/\.artifacts\/janitor-agent-incident\.json/);
 assert.doesNotMatch(src,/gh api -X PATCH "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{pr\}" -f state=open/);
});

test('failed native step writes the one canonical Brain RPC occurrence and verifies immutable readback',async()=>{
 const calls=[];let identity;
 const report=classifyCurrentJanitor({cleanupOutcome:'failure',readbackOutcome:'skipped',runId:41342975119,
   mainSha:'eedc3f8b380cd1e0c986cc0d0ea98854a48813e8'});
 report.source_url='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41342975119';
 report.incident_url='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5320';
 const fetchImpl=async(url,opt)=>{
   calls.push({url,method:opt.method,body:opt.body||null});
   if(opt.method==='POST'){
     identity=JSON.parse(opt.body);
     assert.equal(identity.p_fingerprint,FINGERPRINT);
     assert.equal(identity.p_evidence.status,'INCIDENT_OPEN_STEP_FAILURE');
     return {ok:true,status:200,json:async()=>({})};
   }
   return {ok:true,status:200,json:async()=>[{
     occurrence_id:identity.p_occurrence_id,
     fingerprint:identity.p_fingerprint,
     payload_sha256:identity.p_payload_sha256}]};
 };
 const env={GITHUB_RUN_ATTEMPT:'1',SUPABASE_URL:'https://adhjwmvyoixzjtmiroln.supabase.co',
   SUPABASE_SERVICE_ROLE_KEY:'test-key-only'};
 const result=await writeBrainOccurrence({env,report,fetchImpl});
 assert.equal(result.verified,true);
 assert.equal(result.status,'BRAIN_OCCURRENCE_READBACK_CONFIRMED');
 assert.equal(calls.length,2);
 assert.match(calls[0].url,/\/rest\/v1\/rpc\/brain_observe_failure$/);
 assert.match(calls[1].url,/\/rest\/v1\/brain_failure_occurrences\?/);
});
test('no privileged credentials or failed independent readback cannot be disguised as green',async()=>{
 const report=classifyCurrentJanitor({cleanupOutcome:'failure',readbackOutcome:'skipped',
   runId:4321,mainSha:'eedc3f8b380cd1e0c986cc0d0ea98854a48813e8'});
 const unavailable=await writeBrainOccurrence({env:{},report,fetchImpl:async()=>{throw Error('must not call');}});
 assert.equal(unavailable.verified,false);
 assert.equal(unavailable.status,'BRAIN_RPC_AUTHORITY_UNAVAILABLE');
 await assert.rejects(()=>writeBrainOccurrence({env:{SUPABASE_URL:'https://adhjwmvyoixzjtmiroln.supabase.co',
   SUPABASE_SERVICE_ROLE_KEY:'test-key-only'},report,
   fetchImpl:async(_url,opts)=>opts.method==='POST'
     ?{ok:true,status:200}:{ok:true,status:200,json:async()=>[]}}),/BRAIN_RPC_READBACK_MISMATCH/);
});
