import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
test('instagram transport auth is checked before dispatch claim and fallback stays circuit-bounded',()=>{
  const a=s.indexOf("instagramComposioApiKey=await secret(db,'COMPOSIO_API_KEY')");
  const d=s.indexOf("if(!instagramComposioApiKey && bufferCircuit.active)");
  const b=s.indexOf("state: 'dispatching'");
  const c=s.indexOf('capability=await issuePublishCapability');
  assert.ok(a>=0&&d>a&&b>d&&c>b);
  assert.match(s,/instagram-composio-primary-buffer-fallback-v1/);
  assert.match(s,/deferred_transport/);
  assert.match(s,/BUFFER_RATE_LIMITED/);
  assert.match(s,/instagramInput\(art,due,future\)/);
  assert.match(s,/MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED/);
});