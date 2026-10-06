import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const verifier=fs.readFileSync('supabase/functions/powerhouse-instagram-media-verifier/index.ts','utf8');

test('LinkedIn company requires provider-verified organization capability before publication capability',()=>{
  assert.match(publisher,/organizationCapable=candidates\.filter/);
  assert.match(publisher,/organizationReadVerified===true/);
  assert.match(publisher,/LINKEDIN_COMPANY_ORGANIZATION_CAPABILITY_REQUIRED/);
  assert.match(publisher,/connection_source:'organization_capability_probe'/);
  assert.ok(
    publisher.indexOf('LINKEDIN_COMPANY_ORGANIZATION_CAPABILITY_REQUIRED') <
    publisher.indexOf('await issuePublishCapability'),
    'organization capability must be proven before publication capability issuance'
  );
});

test('Instagram vision verifier exposes provider credit exhaustion without weakening the gate',()=>{
  assert.match(verifier,/VISION_PROVIDER_CREDIT_EXHAUSTED/);
  assert.match(verifier,/credit balance is too low/i);
  assert.match(verifier,/VISION_PROVIDER_REQUEST_FAILED:/);
  assert.match(verifier,/AI_GOVERNANCE_UNAVAILABLE/);
  assert.match(verifier,/visual_verdict/);
});
