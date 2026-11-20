import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isAuthorizedRepairRequest} from '../supabase/functions/db-pooler-repair-v1/security.mjs';
const src=readFileSync('supabase/functions/db-pooler-repair-v1/index.ts','utf8');
const legacy='service.'+'v'.repeat(88);
const modern='sb_secret_'+'x'.repeat(75);
const anon='sb_publishable_'+'p'.repeat(60);
const env=(service=legacy,modernDefault=modern)=>({get(name){
 if(name==='SUPABASE_SERVICE_ROLE_KEY')return service;
 if(name==='SUPABASE_SECRET_KEYS')return JSON.stringify({default:modernDefault});
 return undefined;
}});
const req=(method='POST',headers={})=>new Request('https://example.invalid/functions/v1/db-pooler-repair-v1',{method,headers});
test('refuse unsigned calls, user tokens, anon keys and GET even when privileged bearer is supplied',async()=>{
 assert.equal(await isAuthorizedRepairRequest(req(),env()),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{authorization:'Bearer '+anon}),env()),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{apikey:anon}),env()),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{authorization:'Bearer user.'+'y'.repeat(88)}),env()),false);
 assert.equal(await isAuthorizedRepairRequest(req('GET',{authorization:'Bearer '+legacy}),env()),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{'x-api-key':legacy}),env()),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{authorization:'Bearer '+legacy.slice(0,-1)+'Z'}),env()),false);
});
test('trusted server-to-server bearer and modern default secret accepted for POST only',async()=>{
 assert.equal(await isAuthorizedRepairRequest(req('POST',{authorization:'Bearer '+legacy}),env()),true);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{apikey:modern}),env()),true);
});
test('missing, malformed or weak runtime secrets fail closed',async()=>{
 assert.equal(await isAuthorizedRepairRequest(req('POST',{authorization:'Bearer '+legacy}),env('','')),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{apikey:modern}),env('','')),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{apikey:modern}),{get:n=>n==='SUPABASE_SECRET_KEYS'?'not json':undefined}),false);
 assert.equal(await isAuthorizedRepairRequest(req('POST',{apikey:'short'}),env('','short')),false);
});
test('guard must reject before accessing privileged DB URL, and never echo DB exception details',()=>{
 assert.match(src,/request\.method!=="POST"/);
 assert.match(src,/isAuthorizedRepairRequest\(request,Deno\.env\)/);
 assert.match(src,/return Response\.json\(\{error:"unauthorized"\},\{status:401/);
 const guardAt=src.indexOf('await isAuthorizedRepairRequest');
 const connectAt=src.indexOf('sql=postgres(poolerUrl()');
 assert.ok(guardAt>0&&connectAt>guardAt);
 assert.doesNotMatch(src,/error\s*:\s*\w+\.message/);
 assert.match(src,/error:"maintenance_unavailable"/);
 assert.match(src,/Cache-Control.*no-store/);
});
