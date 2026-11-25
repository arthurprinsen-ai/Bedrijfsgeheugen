import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
test('EU service gateway pins two distinct SHA-256 credentials, not plaintext tokens',()=>{
 const legacy=code.match(/const TOKEN_HASH='([0-9a-f]{64})'/);
 const netlify=code.match(/const NETLIFY_PORTAL_TOKEN_HASH='([0-9a-f]{64})'/);
 assert.ok(legacy&&netlify);
 assert.notEqual(legacy[1],netlify[1]);
 assert.match(code,/serviceTokenHash!==TOKEN_HASH&&serviceTokenHash!==NETLIFY_PORTAL_TOKEN_HASH/);
 assert.match(code,/return json\(\{error:'UNAUTHORIZED'\},401\)/);
});
test('secret verification takes place before tenancy and DB access',()=>{
 const guard=code.indexOf('serviceTokenHash!==TOKEN_HASH');
 const tenant=code.indexOf('const tenantId=String(body?.tenantId');
 const db=code.indexOf('createClient(url,key');
 assert.ok(guard>=0&&tenant>guard&&db>guard);
 assert.match(code,/if\(req.method!=='POST'\)/);
 assert.match(code,/sha256\(token\)/);
});
