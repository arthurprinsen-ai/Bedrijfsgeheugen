import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAuthorizedRepairRequest } from '../supabase/functions/bg-master-control/security.mjs';
import { isAuthorizedRepairRequest as introspectAuth } from '../supabase/functions/db-pooler-introspect-v1/security.mjs';

const root='supabase/functions/';
const master=readFileSync(root+'bg-master-control/index.ts','utf8');
const introspect=readFileSync(root+'db-pooler-introspect-v1/index.ts','utf8');
const service='TEST_ONLY_SERVICE_ROLE_CREDENTIAL_4fa3a13d7410d66045d6b6a725a1b9ee';
const modern='sb_secret_TEST_ONLY_830465f3ae286d100c2583d8b58ed34916fefa61';
const env=new Map([['SUPABASE_SERVICE_ROLE_KEY',service],['SUPABASE_SECRET_KEYS',JSON.stringify({default:modern})]]);
const envObject={get:(k)=>env.get(k)??''};
const req=(method='POST',headers={})=>new Request('https://example.invalid/functions/v1/safe?token='+service,{method,headers});
for(const [name,guard] of [['master',isAuthorizedRepairRequest],['introspect',introspectAuth]]){
 test(name+': ordinary public calls, user credentials and GET cannot access privileged database',async()=>{
  assert.equal(await guard(req(),envObject),false);
  assert.equal(await guard(req('POST',{authorization:'Bearer anon_public_key'}),envObject),false);
  assert.equal(await guard(req('POST',{apikey:'sb_publishable_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}),envObject),false);
  assert.equal(await guard(req('POST',{'x-recovery-token':service}),envObject),false);
  assert.equal(await guard(req('POST',{authorization:'Bearer '+service.slice(0,-1)+'X'}),envObject),false);
  assert.equal(await guard(req('GET',{authorization:'Bearer '+service}),envObject),false);
  assert.equal(await guard(req('POST',{authorization:'Bearer '+service}),{get:()=>''}),false);
  assert.equal(await guard(req('POST',{apikey:modern}),{get:()=>''}),false);
 });
 test(name+': legitimate server-only credentials require POST and exact equality',async()=>{
  assert.equal(await guard(req('POST',{authorization:'Bearer '+service}),envObject),true);
  assert.equal(await guard(req('POST',{apikey:modern}),envObject),true);
  assert.equal(await guard(req('POST',{apikey:modern.slice(0,-1)+'X'}),envObject),false);
 });
}
test('both deployed entrypoints check server-only auth before constructing privileged DB client',()=>{
 const masterGuard=master.indexOf('if(!(await isAuthorizedRepairRequest(req,Deno.env)))');
 const introGuard=introspect.indexOf('if(!(await isAuthorizedRepairRequest(req,Deno.env)))');
 assert.ok(masterGuard>0&&introGuard>0);
 assert.ok(masterGuard<master.indexOf("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"));
 assert.ok(masterGuard<master.indexOf('createClient(url,key'));
 assert.ok(introGuard<introspect.indexOf('postgres(url()'));
 assert.ok(introGuard<introspect.indexOf('Deno.env.get("SUPABASE_DB_URL")'), 'guard must run before DB connection is used in handler');
 for(const source of [master,introspect]){
  assert.ok(source.includes("req.method!=='POST'"));
  assert.ok(source.includes("'UNAUTHORIZED'")||source.includes('"UNAUTHORIZED"'));
  assert.ok(source.includes('no-store'));
  assert.ok(source.includes('nosniff'));
  assert.ok(source.includes('SERVICE_UNAVAILABLE'));
  assert.ok(!source.includes('error:String(e?.message'));
  assert.ok(!source.includes('e instanceof Error?e.message'));
 }
});
