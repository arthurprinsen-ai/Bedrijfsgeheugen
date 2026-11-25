import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {proveScopedPromotionToken} from '../tools/delivery/reviewed-promotion-token.mjs';
const pem=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'});
const now=Date.parse('2026-11-25T08:00:00Z');
const perms={statuses:'write',contents:'read',pull_requests:'read',checks:'read',administration:'read',metadata:'read'};
function fixture({permissions={statuses:'write',metadata:'read'},repositories=[{id:1303700955,full_name:'arthurprinsen-ai/Bedrijfsgeheugen'}],revoke=204,denied=401,issue=201,install=185660155,token='ghs_fixture_private'}={}){
 const calls=[];let revoked=false;
 const reply=(status,value)=>({status,ok:status>=200&&status<300,json:async()=>value});
 const fetchImpl=async(u,o)=>{
   calls.push([u.pathname,o.method]);assert.equal(u.origin,'https://api.github.com');assert.equal(o.redirect,'error');
   if(u.pathname==='/app')return reply(200,{id:5916428,owner:{login:'arthurprinsen-ai',type:'User'},permissions:perms});
   if(u.pathname==='/repos/arthurprinsen-ai/Bedrijfsgeheugen/installation')return reply(200,{id:install,app_id:5916428,account:{login:'arthurprinsen-ai'},repository_selection:'selected',suspended_at:null,permissions:perms});
   if(u.pathname==='/app/installations/185660155/access_tokens'){assert.equal(o.method,'POST');assert.deepEqual(JSON.parse(o.body),{repository_ids:[1303700955],permissions:{statuses:'write',metadata:'read'}});return reply(issue,{token,permissions,expires_at:new Date(now+3600000).toISOString()})}
   assert.equal(o.headers.Authorization,'Bearer '+token);
   if(u.pathname==='/installation/token'){assert.equal(o.method,'DELETE');revoked=true;return reply(revoke)}
   assert.equal(u.pathname,'/installation/repositories');assert.equal(o.method,'GET');return revoked?reply(denied):reply(200,{total_count:repositories.length,repositories});
 };
 return {calls,input:{appId:5916428,privateKey:pem,now,fetchImpl}};
}
test('scoped token proof has exact native lifecycle and no write authority or token output',async()=>{const f=fixture();const result=await proveScopedPromotionToken(f.input);assert.equal(result.scopeVerified,true);assert.equal(result.revocationVerified,true);assert.equal(result.mutationAuthority,false);assert.equal(result.exclusiveWriterVerified,false);assert.equal(JSON.stringify(result).includes('ghs_'),false);assert.deepEqual(f.calls,[['/app','GET'],['/repos/arthurprinsen-ai/Bedrijfsgeheugen/installation','GET'],['/app/installations/185660155/access_tokens','POST'],['/installation/repositories','GET'],['/installation/token','DELETE'],['/installation/repositories','GET']])});
test('broader permissions and unexpected repository fail but still revoke',async()=>{for(const [opts,error] of [[{permissions:{statuses:'write',metadata:'read',contents:'write'}},'PROMOTION_TOKEN_PERMISSIONS_UNPROVEN'],[{repositories:[{id:99,full_name:'other/repo'}]},'PROMOTION_TOKEN_REPOSITORY_SCOPE_UNPROVEN']]){const f=fixture(opts);await assert.rejects(proveScopedPromotionToken(f.input),e=>e.message===error);assert.deepEqual(f.calls.slice(-2),[['/installation/token','DELETE'],['/installation/repositories','GET']])}});
test('revocation must be confirmed by provider and independent rejected read',async()=>{for(const [opts,error] of [[{revoke:500},'PROMOTION_TOKEN_REVOCATION_UNPROVEN'],[{denied:200},'PROMOTION_TOKEN_REVOCATION_READBACK_UNPROVEN']]){const f=fixture(opts);await assert.rejects(proveScopedPromotionToken(f.input),e=>e.message===error)}});
test('wrong installation and issuance rejection never produce success or retry',async()=>{for(const [opts,error,count] of [[{install:2},'PROMOTION_IDENTITY_UNPROVEN',2],[{issue:403},'PROMOTION_TOKEN_ISSUANCE_UNPROVEN',3]]){const f=fixture(opts);await assert.rejects(proveScopedPromotionToken(f.input),e=>e.message===error);assert.equal(f.calls.length,count)}});

test('provider-issued tokens are opaque: old and stateless shapes complete identical scope and revocation checks',async()=>{for(const token of ['ghs_fixture_private','ghs_5916428_fixtureheader.fixturepayload.fixturesignature','future_format.~opaque+value/with-padding=']){const f=fixture({token});const proof=await proveScopedPromotionToken(f.input);assert.equal(proof.revocationVerified,true);assert.equal(proof.mutationAuthority,false);assert.equal(JSON.stringify(proof).includes(token),false);assert.deepEqual(f.calls.slice(-2),[['/installation/token','DELETE'],['/installation/repositories','GET']])}});
test('unsafe header values and empty token remain ambiguous without any credential transport or blind retry',async()=>{for(const token of ['',null,'fake token','fake\\r\\nInjected: yes','fake\r\nInjected: yes']){const f=fixture({token});await assert.rejects(proveScopedPromotionToken(f.input),e=>e.message==='PROMOTION_TOKEN_ISSUANCE_AMBIGUOUS');assert.equal(f.calls.length,3)}});
