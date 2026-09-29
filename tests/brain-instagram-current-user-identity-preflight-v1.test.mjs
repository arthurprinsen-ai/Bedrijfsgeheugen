import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('canonical Instagram preflight resolves the authenticated current user',()=>{
  assert.match(publisher,/INSTAGRAM_GET_USER_INFO'.*ig_user_id:'me'/s);
  assert.match(publisher,/fields:'id,user_id,username,name,account_type'/);
  assert.match(publisher,/deepPickString\(data,\['user_id'\]\)/);
  assert.match(publisher,/deepPickString\(data,\['id'\]\)/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_BUSINESS_ACCOUNT_REQUIRED/);
});

test('canonical Instagram identity validates Graph user_id and username independently',()=>{
  assert.match(publisher,/providerUserId!==INSTAGRAM_CANONICAL_USER_ID/);
  assert.match(publisher,/username!==INSTAGRAM_CANONICAL_USERNAME/);
  assert.doesNotMatch(publisher,/INSTAGRAM_GET_USER_INFO'.*ig_user_id:INSTAGRAM_CANONICAL_USER_ID/s);
});
