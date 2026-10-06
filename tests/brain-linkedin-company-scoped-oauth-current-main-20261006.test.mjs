import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');

test('company OAuth requests explicit organization scopes',()=>{
  assert.match(source,/COMPANY_OAUTH_SCOPES=.*r_organization_admin.*r_organization_social.*w_organization_social/);
  assert.match(source,/COMPANY_REQUIRED_SCOPES=.*r_organization_admin.*w_organization_social/);
  assert.match(source,/credentials:\{scopes:COMPANY_OAUTH_SCOPES\.join\(','\)\}/);
  assert.match(source,/bedrijfsgeheugen-company-canonical/);
  assert.match(source,/LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED/);
});

test('company readiness is bound to the exact fresh OAuth account and live admin ACL',()=>{
  assert.match(source,/oauth_candidate_connection_id/);
  assert.match(source,/freshOauthBound/);
  assert.match(source,/adminAclVerified/);
  assert.match(source,/companyOauthFreshVerified=freshOauthBound&&companyAdminReadReady&&hasOrgWriteScope/);
  assert.match(source,/companyReady=personalReady&&companyOauthFreshVerified/);
  assert.match(source,/company_oauth_connection_id:companyOauthFreshVerified\?accountId:null/);
  assert.match(source,/if\(action==='resume'&&companyReady\)/);
});

test('live v18 direct database hardening is preserved',()=>{
  assert.match(source,/createDirectDb\(\)/);
  assert.match(source,/aws-0-eu-central-1\.pooler\.supabase\.com/);
  assert.match(source,/DB_JSON_COLUMNS/);
});
