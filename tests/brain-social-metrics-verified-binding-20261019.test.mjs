import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/bg-social-metrics-sync/index.ts','utf8');

test('social metrics reuse verified canonical account IDs, never aliases',()=>{
  assert.match(source,/async function verifiedBoundAccount\(/);
  assert.match(source,/instagram-composio-setup-current-state-v1/);
  assert.match(source,/linkedin-composio-setup-current-state-v1/);
  assert.match(source,/proof\.ready!==true\|\|proof\.health_verified!==true/);
  assert.match(source,/stored\?\.status!=='ACTIVE'/);
  assert.match(source,/proof\.username\)\.toLowerCase\(\)!=='bedrijfsgeheugen\.nl'/);
  assert.match(source,/clean\(a\?\.id\|\|a\?\.connected_account_id\)===id/);
  assert.match(source,/clean\(a\?\.user_id\)===userId/);
  assert.match(source,/matched\.length!==1/);
  assert.doesNotMatch(source,/const eligible=a\.filter\(\(x:any\)=>clean\(x\?\.alias\)/);
  assert.doesNotMatch(source,/const canonical=eligible\.filter\(\(x:any\)=>clean\(x\.alias\)/);
});
test('social metrics remain read-only provider operations and fail closed',()=>{
  assert.match(source,/await verifiedBoundAccount\(db,apiKey,'instagram'\)/);
  assert.match(source,/await verifiedBoundAccount\(db,apiKey,'linkedin'\)/);
  assert.match(source,/INSTAGRAM_GET_IG_MEDIA_INSIGHTS/);
  assert.match(source,/LINKEDIN_LIST_REACTIONS/);
  assert.doesNotMatch(source,/LINKEDIN_CREATE_LINKED_IN_POST/);
  assert.doesNotMatch(source,/INSTAGRAM_CREATE_MEDIA/);
  assert.match(source,/provider_snapshots:total/);
  assert.match(source,/healthy\?'observed':'error'/);
  assert.match(source,/!scheduler\|\|clean\(req\.headers\.get\('x-powerhouse-token'\)\)!==scheduler/);
});
