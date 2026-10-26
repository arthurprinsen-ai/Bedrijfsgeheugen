import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');

test('company auth link must not reuse unverified historical OAuth config IDs',()=>{
  assert.match(source,/COMPANY_REQUIRED_SCOPES\.every\(scope=>scopes\.has\(scope\)\)/);
  assert.match(source,/const scopedConfigIds=new Set\(scopedConfigs\.map/);
  assert.match(source,/authConfigCandidates\.find\(id=>scopedConfigIds\.has\(id\)\)/);
  assert.doesNotMatch(source,/let authConfigId=proofAuthConfigId\|\|clean\(priorState\?\.auth_config_id\)/);
});

test('personal login ACTIVE cannot mark LinkedIn company capable after 403',()=>{
  assert.match(source,/company_acl_probe:companyError/);
  assert.match(source,/'OAUTH_SCOPE_DENIED'/);
  assert.match(source,/connection_authority:'production_composio_api_key'/);
  assert.match(source,/const durableState=companyReady\?'ACTIVE':personalReady\?'COMPANY_AUTH_REQUIRED':'CAPABILITY_UNVERIFIED'/);
  assert.match(source,/await writeState\(db,durableState,result\)/);
  assert.doesNotMatch(source,/writeState\(db,personalReady\?'ACTIVE':'CAPABILITY_UNVERIFIED',result\)/);
});

test('the connected production Composio account remains bound to its own proof',()=>{
  assert.match(source,/proofAccountId=proofFresh\?clean\(freshProof\?\.connected_account_id\):''/);
  assert.match(source,/accountsToCheck=proofAccountId/);
  assert.match(source,/adminAclVerified=!companyError&&discoveredOrgUrns\.includes\(configuredOrg\)/);
  assert.match(source,/companyReady=personalReady&&companyOauthFreshVerified&&companyAdminReadReady/);
  assert.doesNotMatch(source,/LINKEDIN_CREATE_LINKED_IN_POST',\{\}/);
});
