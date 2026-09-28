import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const linkedinSetup=readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const instagramSetup=readFileSync('supabase/functions/powerhouse-composio-instagram-setup/index.ts','utf8');

test('LinkedIn setup uses live provider health instead of raw ACTIVE metadata',()=>{
  assert.match(linkedinSetup,/LINKEDIN_GET_MY_INFO/);
  assert.match(linkedinSetup,/REVOKED_ACCESS_TOKEN/);
  assert.match(linkedinSetup,/healthy_accounts/);
  assert.match(linkedinSetup,/bedrijfsgeheugen-canonical/);
  assert.match(linkedinSetup,/COMPOSIO_LINKEDIN_REAUTH_REQUIRED/);
});

test('publisher preflights LinkedIn through live Composio identity before provider mutation',()=>{
  assert.match(publisher,/preflightLinkedInComposio/);
  assert.match(publisher,/preflightLinkedInViaComposio/);
  assert.match(publisher,/LINKEDIN_GET_MY_INFO/);
  assert.match(publisher,/isLinkedInAuthPreflightError/);
  assert.match(publisher,/state:'content_ready'/);
});

test('Instagram setup selects only live bedrijfsgeheugen.nl identity and ignores stale active accounts',()=>{
  assert.match(instagramSetup,/\/me\?fields=id,username/);
  assert.match(instagramSetup,/identity\.username!=='bedrijfsgeheugen\.nl'/);
  assert.match(instagramSetup,/bedrijfsgeheugen-mira-canonical/);
  assert.match(instagramSetup,/healthy_accounts/);
  assert.match(instagramSetup,/COMPOSIO_INSTAGRAM_REAUTH_REQUIRED/);
});

test('Instagram publisher independently verifies exact canonical provider identity',()=>{
  assert.match(publisher,/instagram-composio-only-canonical-graph-id-v2/);
  assert.match(publisher,/INSTAGRAM_CANONICAL_USERNAME='bedrijfsgeheugen\.nl'/);
  assert.match(publisher,/INSTAGRAM_CANONICAL_USER_ID='17841446582493753'/);
  assert.match(publisher,/COMPOSIO_INSTAGRAM_CANONICAL_IDENTITY_REQUIRED/);
  assert.match(publisher,/canonicalInstagramComposioContext/);
  assert.match(publisher,/INSTAGRAM_GET_USER_INFO/);
});
