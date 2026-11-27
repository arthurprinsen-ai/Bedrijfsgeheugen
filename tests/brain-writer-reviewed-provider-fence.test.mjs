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

import {generateKeyPairSync} from 'node:crypto';
import {proveScopedFenceRead} from '../tools/delivery/reviewed-provider-fence.mjs';
const readPem=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'});
const readNow=Date.parse('2026-11-25T18:00:00Z');
const appPerms={statuses:'write',contents:'read',pull_requests:'read',checks:'read',administration:'read',metadata:'read'};
const scopedRead={administration:'read',contents:'read',metadata:'read'};
function scopedFixture({permissions=scopedRead,denied=401,wrongRepo=false,inventoryMode='',scopeHeaders='complete'}={}){
 const base=inventory(),calls=[];base.state.mode=inventoryMode;let revoked=false;
 const reply=(status,value)=>({status,ok:status===200||status===201,headers:{get:()=>null},json:async()=>value});
 const fetchImpl=async(u,o)=>{
   calls.push([u.pathname,o.method]);assert.equal(u.origin,'https://api.github.com');assert.equal(o.redirect,'error');
   if(u.pathname==='/app')return reply(200,{id:5916428,owner:{login:'arthurprinsen-ai',type:'User'},permissions:appPerms});
   if(u.pathname==='/repos/arthurprinsen-ai/Bedrijfsgeheugen/installation')return reply(200,{id:185660155,app_id:5916428,account:{login:'arthurprinsen-ai'},repository_selection:'selected',suspended_at:null,permissions:appPerms});
   if(u.pathname==='/app/installations/185660155/access_tokens'){assert.equal(o.method,'POST');assert.deepEqual(JSON.parse(o.body),{repository_ids:[1303700955],permissions:scopedRead});return reply(201,{token:'fixture_read_only',permissions,expires_at:new Date(readNow+3600000).toISOString()})}
   assert.equal(o.headers.Authorization,'Bearer fixture_read_only');
   if(u.pathname==='/installation/token'){assert.equal(o.method,'DELETE');revoked=true;return reply(204)}
   if(u.pathname==='/installation/repositories'){assert.equal(o.method,'GET');if(revoked)return reply(denied);const response=reply(200,{total_count:1,repositories:[{id:wrongRepo?7:1303700955,full_name:'arthurprinsen-ai/Bedrijfsgeheugen'}]});if(scopeHeaders==='paginated')response.headers={get:k=>k==='link'?'<https://api.github.com/installation/repositories?page=2>; rel="next"':null};if(scopeHeaders==='missing')delete response.headers;return response}
   return base.input.fetchImpl(u.href,o);
 };
 return {calls,input:{appId:5916428,privateKey:readPem,expectedMainSha:MAIN,now:readNow,fetchImpl,sleep:async()=>{}}};
}
test('separate scoped read token inventories exact native configuration and revokes without grant',async()=>{
 const f=scopedFixture();const p=await proveScopedFenceRead(f.input);
 assert.equal(p.fenceState,'NATIVE_CONTEXT_BOUND_EXCLUSIVE_WRITER_UNPROVEN');assert.equal(p.scopeVerified,true);assert.equal(p.revocationVerified,true);assert.equal(p.mutationAuthority,false);assert.equal(p.exclusiveWriterVerified,false);assert.equal(JSON.stringify(p).includes('fixture_read_only'),false);
 assert.equal(f.calls.filter(c=>c[1]==='POST').length,1);assert.equal(f.calls.filter(c=>c[1]==='DELETE').length,1);assert.deepEqual(f.calls.slice(-2),[['/installation/token','DELETE'],['/installation/repositories','GET']]);
});
test('write permission or wrong repository must stop before inventory and revoke',async()=>{
 for(const [opts,error] of [[{permissions:{...scopedRead,statuses:'write'}},'FENCE_READ_TOKEN_PERMISSIONS_UNPROVEN'],[{wrongRepo:true},'FENCE_READ_TOKEN_REPOSITORY_SCOPE_UNPROVEN']]){
 const f=scopedFixture(opts);await assert.rejects(proveScopedFenceRead(f.input),e=>e.message===error);assert.equal(f.calls.some(c=>c[0].endsWith('/protection')),false);assert.deepEqual(f.calls.slice(-2),[['/installation/token','DELETE'],['/installation/repositories','GET']]);
 }
});
test('native inventory denial is not an exclusive fence proof and still revokes',async()=>{
 const f=scopedFixture({inventoryMode:'HTTP403'});const p=await proveScopedFenceRead(f.input);assert.equal(p.fenceState,'NATIVE_FENCE_HTTP_403');assert.equal(p.mutationAuthority,false);assert.equal(p.revocationVerified,true);
});
test('unconfirmed revocation fails closed with no second issuance',async()=>{
 const f=scopedFixture({denied:200});await assert.rejects(proveScopedFenceRead(f.input),e=>e.message==='FENCE_READ_TOKEN_REVOCATION_READBACK_UNPROVEN');assert.equal(f.calls.filter(c=>c[1]==='POST').length,1);
});
test('invalid expected epoch stops before token issuance',async()=>{
 const f=scopedFixture();await assert.rejects(proveScopedFenceRead({...f.input,expectedMainSha:'main'}),e=>e.message==='FENCE_READ_EPOCH_UNPROVEN');assert.equal(f.calls.length,0);
});

test('contradictory pagination or missing scope headers deny inventory and revoke',async()=>{
 for(const scopeHeaders of ['paginated','missing']){
 const f=scopedFixture({scopeHeaders});
 await assert.rejects(proveScopedFenceRead(f.input),e=>e.message==='FENCE_READ_TOKEN_REPOSITORY_SCOPE_UNPROVEN');
 assert.equal(f.calls.some(c=>c[0].endsWith('/protection')),false);
 assert.equal(f.calls.filter(c=>c[1]==='POST').length,1);
 assert.deepEqual(f.calls.slice(-2),[['/installation/token','DELETE'],['/installation/repositories','GET']]);
 }
});
