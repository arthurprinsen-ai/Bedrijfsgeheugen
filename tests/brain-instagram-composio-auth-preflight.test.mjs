import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
test('instagram transport auth is checked before dispatch claim and fallback stays circuit-bounded',()=>{
  const meta=s.indexOf('instagramMetaConfig=await metaInstagramConfig(db)');
  const composio=s.indexOf("instagramComposioApiKey=await secret(db,'COMPOSIO_API_KEY')");
  const deferred=s.indexOf('if(!instagramMetaConfig&&!instagramComposioApiKey&&bufferCircuit.active)');
  const dispatch=s.indexOf("state: 'dispatching'");
  const capability=s.indexOf('capability=await issuePublishCapability');
  assert.ok(meta>=0&&composio>meta&&deferred>composio&&dispatch>deferred&&capability>dispatch);
  assert.match(s,/instagram-meta-primary-composio-buffer-fallback-v1/);
  assert.match(s,/deferred_transport/);
  assert.match(s,/BUFFER_RATE_LIMITED/);
  assert.match(s,/instagramInput\(art,due,future\)/);
  assert.match(s,/MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED/);
});
