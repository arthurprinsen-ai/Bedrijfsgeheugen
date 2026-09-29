import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const config=JSON.parse(readFileSync('config/instagram-canonical-provider-identity-v3.json','utf8'));
const map=readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

const start=publisher.indexOf('async function inspectInstagramComposioIdentity');
const end=publisher.indexOf('async function resolveUniqueInstagramAccount',start);
assert.ok(start>=0&&end>start);
const block=publisher.slice(start,end);

test('Instagram identity preflight keeps node id and Graph user_id distinct',()=>{
  assert.match(block,/fields:'id,user_id,username,name,account_type'/);
  assert.match(block,/providerUserId=deepPickString\(data,\['user_id'\]\)/);
  assert.match(block,/providerNodeId=deepPickString\(data,\['id'\]\)/);
  assert.match(block,/providerUserId!==INSTAGRAM_CANONICAL_USER_ID/);
  assert.equal(config.observed_graph_user_id,'17841446582493753');
  assert.equal(config.observed_connection_node_id,'28537384955950341');
});

test('System Map carries live canonical Instagram truth',()=>{
  assert.match(map,/canonicalGraphUserId:'17841446582493753'/);
  assert.match(map,/providerNodeId:'28537384955950341'/);
  assert.match(map,/liveMediaId:'18105956765257858'/);
  assert.match(map,/nodeIdDistinctFromGraphUserId:true/);
});
