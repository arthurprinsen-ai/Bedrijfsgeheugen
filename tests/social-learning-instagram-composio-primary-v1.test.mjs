import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const sources=JSON.parse(fs.readFileSync('config/powerhouse-data-sources.json','utf8'));

test('Instagram publishing is Composio-primary and never Make fallback',()=>{
  assert.match(publisher,/backend\.composio\.dev\/api\/v3/);
  assert.doesNotMatch(publisher,/api\/v3\.1\/tools\/execute/);
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
  assert.match(publisher,/hook_type: clean\(art\.generation_evidence\?\.hook_type\)/);
  assert.match(publisher,/state:'published'/);
  assert.match(publisher,/recordObligation\(db,runDate,row.channel,'PUBLISHED'/);
  assert.match(publisher,/status:authMissing\?'waiting_auth':'failed'/);
  assert.match(publisher,/state:authMissing\?'content_ready':'failed'/);
  assert.match(publisher,/authMissing\?'APPROVED':'FAILED'/);
});


test('Instagram review preserves hook type and Composio discovers a unique active account',()=>{
  assert.match(publisher,/hook_type: clean\(art\.generation_evidence\?\.hook_type\) \|\| 'Probleem'/);
  assert.match(publisher,/connected_accounts\?toolkit_slugs=instagram&statuses=ACTIVE/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_CONNECTION_REQUIRED/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS/);
});


test('skills canonically forbid Make and route Instagram through Composio',()=>{
  const authority=fs.readFileSync('.agents/skills/powerhouse-toolchain-authority/SKILL.md','utf8');
  const instagramSkill=fs.readFileSync('.agents/skills/instagram-composio-publisher/SKILL.md','utf8');
  const miraSkill=fs.readFileSync('docs/superpowers/skills/instagram-mira-visible-identity-gate-v1.md','utf8');
  const learning=fs.readFileSync('docs/learning/2026-09-18-instagram-composio-primary-v1.md','utf8');
  assert.match(authority,/Composio primary for Instagram/);
  assert.match(authority,/Make is retired/);
  assert.match(instagramSkill,/Make is retired and forbidden/);
  assert.match(instagramSkill,/api\/v3\/tools\/execute/);
  assert.doesNotMatch(instagramSkill,/api\/v3\.1\/tools\/execute/);
  assert.match(miraSkill,/COMPOSIO_API_KEY/);
  assert.match(learning,/COMPOSIO_INSTAGRAM_AUTH_REQUIRED/);
  assert.match(learning,/no external_id is written until provider readback succeeds/i);
});
