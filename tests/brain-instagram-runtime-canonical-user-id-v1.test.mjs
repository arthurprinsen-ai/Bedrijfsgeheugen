import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('Instagram canonical identity is read live from connected account',()=>{
  assert.match(src,/INSTAGRAM_CANONICAL_USERNAME='bedrijfsgeheugen\.nl'/);
  assert.match(src,/INSTAGRAM_GET_USER_INFO'\s*,\s*\{ig_user_id:'me'/);
  assert.match(src,/providerUserId!==INSTAGRAM_CANONICAL_USER_ID/);
});

test('Instagram publish uses verified runtime provider user id',()=>{
  assert.match(src,/INSTAGRAM_POST_IG_USER_MEDIA'\s*,\s*\{ig_user_id:ctx\.providerUserId/);
  assert.match(src,/INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH'\s*,\s*\{ig_user_id:ctx\.providerUserId/);
});
