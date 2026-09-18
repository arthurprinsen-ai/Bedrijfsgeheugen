import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const sources=JSON.parse(fs.readFileSync('config/powerhouse-data-sources.json','utf8'));

test('Instagram publishing is Composio-primary and never Make fallback',()=>{
  assert.match(publisher,/INSTAGRAM_POST_IG_USER_MEDIA/);
  assert.match(publisher,/INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH/);
  assert.match(publisher,/INSTAGRAM_GET_IG_MEDIA/);
  assert.match(publisher,/instagram-composio-primary-v1/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_AUTH_REQUIRED/);
  assert.match(publisher,/never fall back to Make/);
  const source=sources.sources.find(x=>x.id==='instagram-publishing');
  assert.equal(source.provider_layer,'composio');
  assert.deepEqual(source.forbidden_fallbacks,['make']);
});

test('Composio Instagram path keeps exact proof and provider readback',()=>{
  assert.match(publisher,/instagramIdentityProven\(proof\)/);
  assert.match(publisher,/final_media_sha256/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_READBACK_ID_MISMATCH/);
  assert.match(publisher,/provider_truth_verified:true/);
  assert.match(publisher,/state:'published'/);
  assert.match(publisher,/recordObligation\(db,runDate,row.channel,'PUBLISHED'/);
});


test('Instagram review preserves hook type and Composio discovers a unique active account',()=>{
  assert.match(publisher,/hook_type: clean\(art\.generation_evidence\?\.hook_type\) \|\| 'Probleem'/);
  assert.match(publisher,/connected_accounts\?toolkit_slugs=instagram&statuses=ACTIVE/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS/);
});
