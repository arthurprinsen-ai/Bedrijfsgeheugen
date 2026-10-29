import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('supabase/functions/bg-social-metrics-sync/index.ts','utf8');
// Fingerprint: measurement|linkedin-personal|company-auth-required-blocks-personal|20261029-v1
test('personal LinkedIn readback survives COMPANY_AUTH_REQUIRED, only with personal_ready',()=>{
  assert.match(source,/toolkit==='linkedin'&&stored\?\.status==='COMPANY_AUTH_REQUIRED'&&proof\.personal_ready===true/);
  assert.doesNotMatch(source,/toolkit==='instagram'&&stored\?\.status==='COMPANY_AUTH_REQUIRED'/);
  assert.match(source,/proof\.ready!==true\|\|proof\.health_verified!==true/);
});
test('company state is read back from Windsor rows, never a hard-coded block string',()=>{
  assert.doesNotMatch(source,/BLOCKED_ORGANIZATION_PERMISSION_403/);
  assert.match(source,/linkedin_company_account_provider/);
  assert.match(source,/linkedin_company:companyState/);
});
