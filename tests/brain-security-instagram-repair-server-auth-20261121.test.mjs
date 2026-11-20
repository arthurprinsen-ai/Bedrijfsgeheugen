import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isAuthorizedRepairRequest } from '../supabase/functions/powerhouse-composio-instagram-auth-repair/security.mjs';
const index=readFileSync(new URL('../supabase/functions/powerhouse-composio-instagram-auth-repair/index.ts',import.meta.url),'utf8');
const mkEnv=(obj={})=>({get:key=>obj[key]||''});
const request=(method='POST',headers={})=>new Request('https://example.invalid/instagram-repair',{method,headers});
const legacySecret='server-only-legacy-'+'a'.repeat(46);
const modernSecret='sb_secret_'+'b'.repeat(56);

test('anonymous, old fixed repair header, public key and user JWT cannot enter privileged Instagram inspector',async()=>{
 const env=mkEnv({SUPABASE_SERVICE_ROLE_KEY:legacySecret,SUPABASE_SECRET_KEYS:JSON.stringify({default:modernSecret})});
 for(const r of [request(),request('POST',{'x-repair-key':'stale-fixed-header'}),request('POST',{authorization:'Bearer user-jwt'}),request('POST',{apikey:'sb_publishable_public'}),request('GET',{authorization:'Bearer '+legacySecret})])
  assert.equal(await isAuthorizedRepairRequest(r,env),false);
});
test('server-only service role bearer and modern default sb_secret apikey are accepted',async()=>{
 const env=mkEnv({SUPABASE_SERVICE_ROLE_KEY:legacySecret,SUPABASE_SECRET_KEYS:JSON.stringify({default:modernSecret})});
 assert.equal(await isAuthorizedRepairRequest(request('POST',{authorization:'Bearer '+legacySecret}),env),true);
 assert.equal(await isAuthorizedRepairRequest(request('POST',{apikey:modernSecret}),env),true);
 assert.equal(await isAuthorizedRepairRequest(request('POST',{apikey:modernSecret.slice(0,-1)+'x'}),env),false);
});
test('missing, short or malformed environment secrets fail closed',async()=>{
 for(const env of [mkEnv(),mkEnv({SUPABASE_SERVICE_ROLE_KEY:'short'}),mkEnv({SUPABASE_SECRET_KEYS:'{broken-json'}),mkEnv({SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_publishable_unsafe'})})]){
  assert.equal(await isAuthorizedRepairRequest(request('POST',{authorization:'Bearer '+legacySecret,apikey:modernSecret}),env),false);
 }
});
test('runtime guard occurs before any service-role DB or Composio API access, and output is redacted',()=>{
 const guard=index.indexOf('await isAuthorizedRepairRequest(req,Deno.env)');
 const credentials=index.indexOf('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
 const provider=index.indexOf('fetch("https://backend.composio.dev');
 assert.ok(guard>0&&credentials>guard&&provider>credentials);
 assert.match(index,/req.method!=="POST"/);
 assert.match(index,/status:401/);
 assert.match(index,/auth_config_count/);
 assert.doesNotMatch(index,/req.headers.get\(['"]x-repair-key['"]\)/);
 assert.doesNotMatch(index,/auth_config_details:details/);
 assert.match(index,/AbortSignal.timeout\(9000\)/);
 assert.match(index,/no-store/);
});
