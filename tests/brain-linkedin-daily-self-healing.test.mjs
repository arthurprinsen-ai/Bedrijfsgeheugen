import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publisher = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const setup = readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');

test('LinkedIn company publisher self-heals missing measurable daily campaign links before review', () => {
  assert.match(publisher,/async function ensureLinkedInCompanyMeasuredLink/);
  assert.match(publisher,/li-company-'\+compact/);
  assert.match(publisher,/bg_campaign_links/);
  assert.match(publisher,/measurable_link_verified:true/);
  assert.match(publisher,/if\(row\.channel==='linkedin_company'\)\{/);
  assert.match(publisher,/await ensureLinkedInCompanyMeasuredLink\(db,runDate,art\)/);
});

test('LinkedIn company provider create remains fail-closed against duplicate recovery', () => {
  assert.match(publisher,/provider_create_success:true/);
  assert.match(publisher,/republish_forbidden:true/);
  assert.match(publisher,/verification_pending:true/);
  assert.match(publisher,/verified\?'PUBLISHED':'DISPATCHED'/);
});

test('LinkedIn setup distinguishes publish readiness from exact readback readiness', () => {
  assert.match(setup,/r_member_social/);
  assert.match(setup,/r_organization_social/);
  assert.match(setup,/personal_readback_ready:personalReadbackReady/);
  assert.match(setup,/company_readback_ready:companyReadbackReady/);
  assert.match(setup,/company_ready:companyReady/);
});
