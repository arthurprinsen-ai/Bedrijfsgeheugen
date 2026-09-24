import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts', 'utf8');

test('LinkedIn publishing authority is Composio-only before Buffer fallback', () => {
  assert.match(source, /publishLinkedInPersonalViaComposio/);
  assert.match(source, /publishLinkedInCompanyViaComposio/);
  assert.match(source, /transport_contract:'linkedin-composio-direct-v2'/);
  assert.doesNotMatch(source, /row\.channel === 'linkedin_company' && bufferCircuit\.active/);
  assert.doesNotMatch(source, /await markLinkedInRateLimited\(db,runDate,bufferCircuit\)/);

  const companyPublish = source.indexOf("if (row.channel === 'linkedin_company') {", source.indexOf("publishLinkedInPersonalViaComposio"));
  const genericBuffer = source.indexOf("if (!bufferToken)");
  assert.ok(companyPublish >= 0, 'LinkedIn company Composio branch missing');
  assert.ok(genericBuffer > companyPublish, 'LinkedIn company must terminate before generic Buffer fallback');
});

test('LinkedIn company fails closed unless exact Composio readback is proven', () => {
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_EXACT_READBACK_MISMATCH/);
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_AUTHOR_UNVERIFIED/);
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_AUTHOR_AMBIGUOUS/);
  assert.match(source, /republish_forbidden:true/);
  assert.match(source, /do not fall back to Buffer or issue a replacement post/);
});


test('Composio execution uses v3.1 latest tool semantics', () => {
  assert.match(source,/https:\/\/backend\.composio\.dev\/api\/v3\.1/);
  assert.match(source,/version:'latest'/);
  assert.doesNotMatch(source,/backend\.composio\.dev\/api\/v3'/);
});
