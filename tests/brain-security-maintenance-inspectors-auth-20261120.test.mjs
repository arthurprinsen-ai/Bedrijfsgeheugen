import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isAuthorizedRepairRequest as inspectorAuth} from '../supabase/functions/netlify-live-repair-inspector/security.mjs';
import {isAuthorizedRepairRequest as recoveryAuth,matchesPrivateRecoveryToken} from '../supabase/functions/db-recovery-inspect/security.mjs';
const inspector=readFileSync('supabase/functions/netlify-live-repair-inspector/index.ts','utf8');
const recovery=readFileSync('supabase/functions/db-recovery-inspect/index.ts','utf8');
const legacy='service.'+'q'.repeat(88),modern='sb_secret_'+'t'.repeat(78),custom='recovery.'+'z'.repeat(80);
const env=({role=legacy,secret=modern,recoveryToken=custom}={})=>({get:name=>{
 if(name==='SUPABASE_SERVICE_ROLE_KEY')return role;
 if(name==='SUPABASE_SECRET_KEYS')return JSON.stringify({default:secret});
 if(name==='DB_RECOVERY_INSPECT_TOKEN')return recoveryToken;
}});
const req=(method='POST',headers={})=>new Request('https://example.invalid/internal',{method,headers});
test('Netlify inspector rejects anonymous calls, auth is checked before any proxy access',async()=>{
 assert.equal(await inspectorAuth(req(),env()),false);
 assert.equal(await inspectorAuth(req('GET',{authorization:'Bearer '+legacy}),env()),false);
 assert.equal(await inspectorAuth(req('POST',{apikey:'sb_publishable_abc'}),env()),false);
 assert.equal(await inspectorAuth(req('POST',{authorization:'Bearer '+legacy}),env()),true);
 assert.equal(await inspectorAuth(req('POST',{apikey:modern}),env()),true);
 assert.doesNotMatch(inspector,/REPAIR_TOKEN=|repair-netlify-live-[0-9]/);
 assert.match(inspector,/await isAuthorizedRepairRequest\(req,Deno\.env\)/);
 assert.ok(inspector.indexOf('await isAuthorizedRepairRequest')<inspector.indexOf('const proxy=await proxyBase()'));
 assert.match(inspector,/inspection_unavailable/);
});
test('PostgREST recovery inspector fails closed if environment token is absent',async()=>{
 assert.equal(await matchesPrivateRecoveryToken('',env({recoveryToken:''})),false);
 assert.equal(await matchesPrivateRecoveryToken('',env({recoveryToken:custom})),false);
 assert.equal(await matchesPrivateRecoveryToken('wrong',env()),false);
 assert.equal(await matchesPrivateRecoveryToken(custom,env()),true);
 assert.equal(await matchesPrivateRecoveryToken(custom,env({recoveryToken:''})),false);
 assert.equal(await recoveryAuth(req(),env()),false);
 assert.equal(await recoveryAuth(req('POST',{authorization:'Bearer '+legacy}),env()),true);
 assert.equal(await recoveryAuth(req('POST',{apikey:modern}),env()),true);
 assert.match(recovery,/await matchesPrivateRecoveryToken/);
 assert.ok(recovery.indexOf('await matchesPrivateRecoveryToken')<recovery.indexOf('Deno.env.get("SUPABASE_DB_URL")'));
});
test('both inspectors preserve POST-only request semantics and avoid leaking database errors',()=>{
 for(const code of [inspector,recovery]){
  assert.match(code,/req\.method\s*!==\s*["']POST["']/);
  assert.match(code,/status:401|\},401\)/);
 }
 assert.doesNotMatch(recovery,/message:String\(e\?\.message/);
 assert.match(recovery,/POSTGREST_RECOVERY_FAILED/);
});
