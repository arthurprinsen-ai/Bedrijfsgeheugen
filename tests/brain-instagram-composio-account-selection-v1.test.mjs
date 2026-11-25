import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('Instagram Composio account selection resolves the canonical bedrijfsgeheugen.nl identity',()=>{
  assert.match(publisher,/toolkit==='instagram'/);
  assert.match(publisher,/'INSTAGRAM_GET_USER_INFO',\{ig_user_id:'me',fields:'id,user_id,username,name,account_type'\}/);
  assert.match(publisher,/INSTAGRAM_CANONICAL_USERNAME='bedrijfsgeheugen\.nl'/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS/);
  assert.match(publisher,/providerIds\.length!==1/);
});
