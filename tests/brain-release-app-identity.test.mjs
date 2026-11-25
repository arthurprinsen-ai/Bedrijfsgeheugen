import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify} from 'node:crypto';
import {verifyReleaseApp} from '../tools/delivery/release-app-identity.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const pem=privateKey.export({type:'pkcs8',format:'pem'});
const permissions={statuses:'write',contents:'read',pull_requests:'read',checks:'read',administration:'read',metadata:'read'};
function fixture(){
 const app={id:999,owner:{login:'arthurprinsen-ai',type:'User'},permissions:{...permissions}};
 const installation={id:123,app_id:999,account:{login:'arthurprinsen-ai'},repository_selection:'selected',suspended_at:null,permissions:{...permissions}};
 const calls=[];
 const fetchImpl=async(url,opts)=>{calls.push(url.pathname);assert.equal(url.origin,'https://api.github.com');assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');const [h,p,s]=opts.headers.Authorization.slice(7).split('.');assert.ok(verify('RSA-SHA256',Buffer.from(h+'.'+p),publicKey,Buffer.from(s,'base64url')));assert.equal(JSON.parse(Buffer.from(p,'base64url')).iss,'999');return {ok:true,json:async()=>url.pathname==='/app'?app:installation}};
 return {app,installation,calls,input:{appId:999,privateKey:pem,fetchImpl}};
}
test('signed app identity is not exclusive promotion authority',async()=>{const f=fixture();const r=await verifyReleaseApp(f.input);assert.equal(r.authenticated,true);assert.equal(r.exclusiveWriterVerified,false);assert.equal(r.mutationAuthority,false);assert.deepEqual(f.calls,['/app','/repos/arthurprinsen-ai/Bedrijfsgeheugen/installation']);assert.equal(JSON.stringify(r).includes('PRIVATE KEY'),false)});
test('common Actions identity and absent credential fail without API call',async()=>{const f=fixture();for(const input of [{...f.input,appId:15368},{...f.input,privateKey:''}])await assert.rejects(verifyReleaseApp(input),/DEDICATED_APP_CREDENTIAL_REQUIRED/);assert.equal(f.calls.length,0)});
test('wrong owner, ID or broader permissions fail',async()=>{for(const edit of [a=>a.id=5,a=>a.owner.login='other',a=>a.permissions.contents='write',a=>a.permissions.issues='write']){const f=fixture();edit(f.app);await assert.rejects(verifyReleaseApp(f.input),/APP_IDENTITY_OR_PERMISSIONS_UNPROVEN/)}});
test('wrong, suspended or broad installation fails',async()=>{for(const edit of [a=>a.app_id=5,a=>a.suspended_at='2026-11-25',a=>a.repository_selection='all',a=>a.permissions.administration='write']){const f=fixture();edit(f.installation);await assert.rejects(verifyReleaseApp(f.input),/APP_INSTALLATION_SCOPE_UNPROVEN/)}});
test('403 does not become fake authority',async()=>{const f=fixture();f.input.fetchImpl=async()=>({ok:false,status:403});await assert.rejects(verifyReleaseApp(f.input),/APP_NATIVE_AUTH_HTTP_403/)});

test('invalid nonempty key yields fixed safe code without native calls',async()=>{const f=fixture();await assert.rejects(verifyReleaseApp({...f.input,privateKey:'not-a-pem-sensitive-marker'}),e=>e.message==='APP_PRIVATE_KEY_PARSE_FAILED');assert.equal(f.calls.length,0)});
test('network exception never exposes native error or credential',async()=>{const f=fixture();f.input.fetchImpl=async()=>{throw Error('sensitive-marker')};await assert.rejects(verifyReleaseApp(f.input),e=>e.message==='APP_NATIVE_NETWORK_FAILED')});
test('invalid response never exposes provider error or body',async()=>{for(const response of [null,{ok:false,status:'sensitive-marker'},{ok:true,json:async()=>{throw Error('sensitive-marker')}},{ok:true,json:async()=>null},{ok:true,json:async()=>[]}]){const f=fixture();f.input.fetchImpl=async()=>response;await assert.rejects(verifyReleaseApp(f.input),e=>e.message==='APP_NATIVE_RESPONSE_INVALID')}});
