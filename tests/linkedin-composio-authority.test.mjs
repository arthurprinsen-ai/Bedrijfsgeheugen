import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts', 'utf8');

test('LinkedIn personal and company publish through Composio, never Buffer', () => {
  assert.match(source, /publishLinkedInPersonalViaComposio/);
  assert.match(source, /publishLinkedInCompanyViaComposio/);
  assert.match(source, /transport_contract:'linkedin-composio-direct-v2'/);
  assert.doesNotMatch(source, /row\.channel === 'linkedin_company' && bufferCircuit\.active/);
  assert.doesNotMatch(source, /await markLinkedInRateLimited\(db,runDate,bufferCircuit\)/);

  const companyBranch = source.indexOf("if (row.channel === 'linkedin_company') {", source.indexOf("consumePublishCapability"));
  const bufferFallback = source.indexOf("if (!bufferToken)");
  assert.ok(companyBranch > -1, 'company Composio publish branch must exist');
  assert.ok(bufferFallback > companyBranch, 'Buffer fallback must be unreachable for LinkedIn company');
});

test('LinkedIn company Composio path requires exact provider readback and fail-closed semantics', () => {
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_EXACT_READBACK_MISMATCH/);
  assert.match(source, /provider_truth_verified:true/);
  assert.match(source, /republish_forbidden:true/);
  assert.match(source, /do not fall back to Buffer or issue a replacement post/);
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_AUTHOR_AMBIGUOUS/);
});
