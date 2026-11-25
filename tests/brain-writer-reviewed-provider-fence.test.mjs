import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyReviewedProviderFence,PROMOTION_CONTEXT,readReviewedProviderFence} from '../tools/delivery/reviewed-provider-fence.mjs';
const names=['CodeQL javascript-typescript','hygiene / admission','test'];
const fixture=()=>({repository:'arthurprinsen-ai/Bedrijfsgeheugen',branch:'main',complete:true,rulesets:[],protection:{required_status_checks:{strict:true,checks:names.map(context=>({context,app_id:15368})),contexts:[...names]},enforce_admins:{enabled:true},required_conversation_resolution:{enabled:true},allow_force_pushes:{enabled:false},allow_deletions:{enabled:false},lock_branch:{enabled:false}}});
const add=(f,id=5916428)=>{f.protection.required_status_checks.checks.push({context:PROMOTION_CONTEXT,app_id:id});f.protection.required_status_checks.contexts.push(PROMOTION_CONTEXT);return f};
test('observed native baseline refuses missing dedicated context',()=>{const p=classifyReviewedProviderFence(fixture());assert.equal(p.state,'DEDICATED_CONTEXT_MISSING');assert.equal(p.mutationAuthority,false)});
test('exact App-bound context is necessary but does not prove exclusive authority',()=>{const p=classifyReviewedProviderFence(add(fixture()));assert.equal(p.state,'NATIVE_CONTEXT_BOUND_EXCLUSIVE_WRITER_UNPROVEN');assert.equal(p.exclusiveWriterVerified,false);assert.equal(p.mutationAuthority,false)});
test('common Actions identity cannot grant dedicated context',()=>assert.equal(classifyReviewedProviderFence(add(fixture(),15368)).state,'DEDICATED_CONTEXT_BINDING_UNPROVEN'));
test('missing or widened existing protection fails closed',()=>{for(const edit of [f=>f.protection.enforce_admins.enabled=false,f=>f.protection.required_status_checks.strict=false,f=>f.protection.allow_force_pushes.enabled=true,f=>f.protection.allow_deletions.enabled=true,f=>delete f.protection.required_conversation_resolution]){const f=add(fixture());edit(f);assert.equal(classifyReviewedProviderFence(f).state,'BASELINE_PROTECTION_UNPROVEN')}});
test('unreviewed native rulesets or bypass configuration fail closed',()=>{const f=add(fixture());f.rulesets=[{id:1}];assert.equal(classifyReviewedProviderFence(f).state,'NATIVE_PROTECTION_INVENTORY_UNPROVEN');const g=add(fixture());g.protection.required_pull_request_reviews={bypass_pull_request_allowances:{users:[{}]}};assert.equal(classifyReviewedProviderFence(g).state,'ADDITIONAL_PROTECTION_REVIEW_REQUIRED')});
test('duplicate, missing and extra checks cannot masquerade as exact fence',()=>{const f=add(fixture());f.protection.required_status_checks.contexts.push(PROMOTION_CONTEXT);assert.equal(classifyReviewedProviderFence(f).state,'REQUIRED_CHECK_INVENTORY_UNPROVEN');const g=add(fixture());g.protection.required_status_checks.checks[0].app_id=5916428;assert.equal(classifyReviewedProviderFence(g).state,'BASELINE_REQUIRED_CHECK_UNPROVEN');const h=add(fixture());h.protection.required_status_checks.checks.push({context:'unknown',app_id:5916428});h.protection.required_status_checks.contexts.push('unknown');assert.equal(classifyReviewedProviderFence(h).state,'DEDICATED_CONTEXT_BINDING_UNPROVEN')});

const MAIN='a'.repeat(40),API='https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen';
function inventory(){
 const data=add(fixture()),calls=[],state={branchReads:0,protectionReads:0,mode:''};
 const fetchImpl=async(url,opts)=>{
  calls.push({url,method:opts.method,redirect:opts.redirect});
  assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
  const path=url.slice(API.length);let body;
  if(path==='')body={id:1303700955,full_name:'arthurprinsen-ai/Bedrijfsgeheugen'};
  else if(path==='/branches/main'){state.branchReads++;body={name:'main',protected:true,commit:{sha:state.mode==='branch drift'&&state.branchReads===2?'b'.repeat(40):MAIN}}}
  else if(path==='/branches/main/protection'){state.protectionReads++;body=JSON.parse(JSON.stringify(data.protection));if(state.mode==='protection drift'&&state.protectionReads===2)body.enforce_admins.enabled=false}
  else if(path==='/rulesets?includes_parents=true&per_page=100')body=state.mode==='full page'?Array(100).fill({id:1}):data.rulesets;
  else if(path==='/rules/branches/main')body=state.mode==='effective rules'?[{type:'required_status_checks'}]:[];
  else throw Error('unexpected endpoint');
  if(state.mode==='HTTP403'&&path.endsWith('/protection'))return {status:403};
  return {status:200,headers:{get:key=>state.mode==='pagination'&&path.startsWith('/rulesets')?'<https://example.invalid>; rel="next"':null},json:async()=>body};
 };
 return {data,calls,state,input:{token:'fixture_token',expectedMainSha:MAIN,fetchImpl}};
}
for(const [mode,expected] of [
 ['', 'NATIVE_CONTEXT_BOUND_EXCLUSIVE_WRITER_UNPROVEN'],
 ['branch drift','NATIVE_FENCE_MAIN_EPOCH_UNPROVEN'],
 ['protection drift','NATIVE_FENCE_CONFIGURATION_CHANGED'],
 ['full page','NATIVE_FENCE_INVENTORY_INCOMPLETE'],
 ['pagination','NATIVE_FENCE_INVENTORY_INCOMPLETE'],
 ['effective rules','NATIVE_EFFECTIVE_RULES_REVIEW_REQUIRED'],
 ['HTTP403','NATIVE_FENCE_HTTP_403']
])test('native inventory: '+(mode||'complete'),async()=>{
 const f=inventory();f.state.mode=mode;
 const result=await readReviewedProviderFence(f.input);
 assert.equal(result.state,expected);
 assert.equal(result.exclusiveWriterVerified,false);assert.equal(result.mutationAuthority,false);
 assert.ok(f.calls.every(c=>c.url.startsWith(API)&&c.method==='GET'&&c.redirect==='error'));
});
test('invalid epoch or credential does not request provider',async()=>{
 const f=inventory();const r=await readReviewedProviderFence({...f.input,expectedMainSha:'main'});
 assert.equal(r.state,'NATIVE_READ_CREDENTIAL_OR_EPOCH_UNPROVEN');assert.equal(f.calls.length,0);
});
