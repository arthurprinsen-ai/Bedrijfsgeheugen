import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const linkedinSetup=readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const instagramSetup=readFileSync('supabase/functions/powerhouse-composio-instagram-setup/index.ts','utf8');

test('LinkedIn uses live provider health instead of raw ACTIVE account count',()=>{
  assert.match(linkedinSetup,/LINKEDIN_GET_MY_INFO/);
  assert.match(linkedinSetup,/REVOKED_ACCESS_TOKEN/);
  assert.match(linkedinSetup,/healthy_accounts/);
  assert.match(linkedinSetup,/bedrijfsgeheugen-canonical/);
  assert.match(linkedinSetup,/COMPOSIO_LINKEDIN_REAUTH_REQUIRED/);
});

test('publisher preflights LinkedIn auth before canonical claim and capability consumption',()=>{
  const preflight=publisher.indexOf("await preflightLinkedInConnection(db)");
  const claim=publisher.indexOf("const { data: claimed, error: claimError }");
  const consume=publisher.indexOf("await consumePublishCapability(db,capability,runDate,row.channel,textHash,mediaSha)");
  assert.ok(preflight>0);
  assert.ok(claim>preflight);
  assert.ok(consume>claim);
  assert.match(publisher,/COMPOSIO_LINKEDIN_REAUTH_REQUIRED/);
  assert.match(publisher,/state:'content_ready'/);
});

test('Instagram setup selects only live bedrijfsgeheugen.nl identity and ignores stale active accounts',()=>{
  assert.match(instagramSetup,/\/me\?fields=id,username/);
  assert.match(instagramSetup,/identity\.username!=='bedrijfsgeheugen\.nl'/);
  assert.match(instagramSetup,/bedrijfsgeheugen-mira-canonical/);
  assert.match(instagramSetup,/healthy_accounts/);
  assert.match(instagramSetup,/COMPOSIO_INSTAGRAM_REAUTH_REQUIRED/);
});

test('Instagram publisher consumes the health-verified setup account, not a stale secret pin',()=>{
  assert.match(publisher,/instagram-composio-setup-current-state-v1/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_IDENTITY_MISMATCH/);
  assert.match(publisher,/await composioInstagramContext\(db\)/);
  assert.doesNotMatch(publisher,/let accountId=await secret\(db,'COMPOSIO_INSTAGRAM_CONNECTED_ACCOUNT_ID'\)/);
});
