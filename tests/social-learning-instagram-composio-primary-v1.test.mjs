import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const sources=JSON.parse(fs.readFileSync('config/powerhouse-data-sources.json','utf8'));

test('Instagram publishing is Composio-primary and never Make fallback',()=>{
  // Canonical base since 2026-09-24 is api/v3.1 (see brain-instagram-composio-proxy-base-v1); no substring mutation.
  assert.ok(publisher.includes("const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1'"));
  assert.ok(publisher.includes('COMPOSIO_BASE}/tools/execute/${toolSlug}'));
  assert.match(publisher,/INSTAGRAM_POST_IG_USER_MEDIA/);
  assert.match(publisher,/INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH/);
  assert.match(publisher,/INSTAGRAM_GET_IG_MEDIA/);
  assert.match(publisher,/transport_contract:'instagram-composio-only-canonical-graph-id-v2'/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_AUTH_REQUIRED/);
  assert.match(publisher,/make_dependency:false/);
  assert.match(publisher,/buffer_dependency:false,meta_direct_dependency:false/);
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
  // Missing provider auth is resumable: claim stays content_ready/APPROVED and reports waiting_auth without a provider side effect.
  assert.match(publisher,/status:'waiting_auth',provider:'composio',resumable:true,provider_side_effect:false/);
  assert.match(publisher,/state:'content_ready'/);
  assert.match(publisher,/recordObligation\(db,runDate,row\.channel,'APPROVED'/);
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
  assert.match(instagramSkill,/backend\.composio\.dev\/api\/v3\.1\/tools\/execute/);
  assert.match(miraSkill,/COMPOSIO_API_KEY/);
  assert.match(learning,/COMPOSIO_INSTAGRAM_AUTH_REQUIRED/);
  assert.match(learning,/no external_id is written until provider readback succeeds/i);
});
