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


test('personal OAuth never requests LinkedIn closed r_member_social permission',()=>{
  // Restrict to the original personal OAuth branch: other products may legitimately
  // mention read scopes, but no unavailable scope may enter a personal Connect URL.
  const branch=source.slice(source.indexOf("if(action==='create_personal_link')"),source.indexOf("if(action==='create_link')"));
  assert.match(branch,/const PERSONAL_OAUTH_SCOPES=\['openid','profile','email','w_member_social'\]/);
  assert.doesNotMatch(branch,/PERSONAL_OAUTH_SCOPES=\[[^\]]*'r_member_social'/);
  assert.match(branch,/PERSONAL_OAUTH_SCOPES\.every\(scope=>scopes\.has\(scope\)\)/);
  assert.match(branch,/\[\.\.\.scopes\]\.every\(scope=>PERSONAL_OAUTH_SCOPES\.includes\(scope\)\)/);
  assert.match(branch,/const PERSONAL_ALIAS='bedrijfsgeheugen-personal-canonical'/);
  assert.match(branch,/user_id:USER_ID,alias:PERSONAL_ALIAS/);
  assert.match(branch,/requested_personal_scopes:PERSONAL_OAUTH_SCOPES/);
  assert.doesNotMatch(branch,/w_organization_social|r_organization_admin/);
});

test('personal OAuth recovers an expired alias with one bounded owner-scoped retry',()=>{
  const personal=source.slice(source.indexOf("if(action==='create_personal_link')"),source.indexOf("if(action==='create_link')"));
  assert.match(personal,/let candidateAlias=PERSONAL_ALIAS/);
  assert.match(personal,/user_id:USER_ID,alias:PERSONAL_ALIAS/);
  assert.match(personal,/COMPOSIO_LINKEDIN_SETUP_400:/);
  assert.match(personal,/already in use by another connection for this entity/);
  assert.match(personal,/candidateAlias=PERSONAL_ALIAS\+'-reauth-'\+crypto\.randomUUID\(\)\.slice\(0,12\)/);
  assert.match(personal,/user_id:USER_ID,alias:candidateAlias/);
  assert.match(personal,/alias_collision_recovered:candidateAlias!==PERSONAL_ALIAS/);
  assert.doesNotMatch(personal,/DELETE|\/connected_accounts\/.*delete|statuses:\['DELETED'\]/);
  assert.doesNotMatch(personal,/r_organization_admin|w_organization_social/);
});

test('canonical publisher still requires source reservation, records provider side effects and does not downgrade proof',()=>{
  const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
  assert.match(publisher,/powerhouse_reserve_unique_publication_v1/);
  assert.match(publisher,/preflightLinkedInComposio\(db\)/);
  assert.match(publisher,/provider_create_success:true/);
  assert.match(publisher,/verification_pending:true/);
  assert.match(publisher,/republish_forbidden:true/);
  assert.match(publisher,/readback_permission_limited/);
  assert.match(publisher,/LINKEDIN_PERSONAL_PROVIDER_CREATE_NOT_PROVEN/);
});
