import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const start=publisher.indexOf('async function inspectInstagramComposioIdentity');
const end=publisher.indexOf('async function resolveUniqueInstagramAccount',start);
assert.ok(start>=0&&end>start,'inspectInstagramComposioIdentity block must exist');
const identityBlock=publisher.slice(start,end);

test('canonical Instagram preflight resolves the authenticated current user',()=>{
  assert.match(identityBlock,/INSTAGRAM_GET_USER_INFO'.*ig_user_id:'me'/s);
  assert.match(identityBlock,/fields:'id,user_id,username,name,account_type'/);
  assert.match(identityBlock,/deepPickString\(data,\['user_id'\]\)/);
  assert.match(identityBlock,/deepPickString\(data,\['id'\]\)/);
  assert.match(identityBlock,/COMPOSIO_INSTAGRAM_BUSINESS_ACCOUNT_REQUIRED/);
});

test('canonical Instagram identity validates Graph user_id and username independently',()=>{
  assert.match(identityBlock,/providerUserId!==INSTAGRAM_CANONICAL_USER_ID/);
  assert.match(identityBlock,/username!==INSTAGRAM_CANONICAL_USERNAME/);
  assert.doesNotMatch(identityBlock,/ig_user_id:INSTAGRAM_CANONICAL_USER_ID/);
});
