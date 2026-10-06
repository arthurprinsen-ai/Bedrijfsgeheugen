import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const setup=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const loop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');

test('LinkedIn capability discovery is read-only while OAuth config is organization-capable',()=>{
  assert.match(setup,/toolkit_slugs=linkedin&statuses=ACTIVE/);
  assert.match(setup,/LINKEDIN_GET_MY_INFO/);
  assert.match(setup,/LINKEDIN_GET_COMPANY_INFO/);
  assert.match(setup,/COMPANY_OAUTH_SCOPES=.*r_organization_admin.*w_organization_social/);
  assert.doesNotMatch(setup,/await execute\([^\n]*'LINKEDIN_CREATE_LINKED_IN_POST'/);
  assert.doesNotMatch(setup,/await execute\([^\n]*'LINKEDIN_CREATE_VIDEO_POST'/);
});

test('LinkedIn personal and company capability are proven separately',()=>{
  assert.match(setup,/personal_ready/);
  assert.match(setup,/personal_author_urn/);
  assert.match(setup,/company_ready/);
  assert.match(setup,/company_author_urns/);
  assert.match(setup,/COMPOSIO_LINKEDIN_CONNECTION_AMBIGUOUS/);
});

test('closed loop checks LinkedIn capability before social publisher dispatch',()=>{
  const capability=loop.indexOf("'powerhouse-composio-linkedin-setup'");
  const publisher=loop.indexOf("'powerhouse-social-publisher'");
  assert.ok(capability>=0&&publisher>capability);
});

test('capability state exposes no Composio secret values',()=>{
  assert.match(setup,/secret_values_exposed:false/);
  assert.match(setup,/api_key_present:true/);
  assert.doesNotMatch(setup,/result=.*apiKey/);
});

test('LinkedIn Composio execution uses v3.1 latest tool semantics',()=>{
  assert.match(setup,/https:\/\/backend\.composio\.dev\/api\/v3\.1/);
  assert.match(setup,/version:'latest'/);
  assert.match(setup,/arguments:args/);
  assert.match(setup,/LINKEDIN_GET_MY_INFO',\{\}/);
  assert.match(setup,/LINKEDIN_GET_COMPANY_INFO',\{role:'ADMINISTRATOR',count:100,start:0,state:'APPROVED'\}/);
  assert.doesNotMatch(setup,/api\/v3'|api\/v3"/);
});

test('connected-account user_id is forwarded to every Composio LinkedIn tool call',()=>{
  assert.match(setup,/COMPOSIO_LINKEDIN_CONNECTED_ACCOUNT_USER_ID_REQUIRED/);
  assert.match(setup,/user_id:userId/);
  assert.match(setup,/execute\(key,candidateAccountId,candidateUserId,'LINKEDIN_GET_MY_INFO'/);
  assert.match(setup,/execute\(key,accountId,userId,'LINKEDIN_GET_COMPANY_INFO'/);
});

test('company capability stays fail-closed without fresh bound organization OAuth',()=>{
  assert.match(setup,/COMPANY_PROOF_RECORD='linkedin-company-oauth-fresh-proof-v1'/);
  assert.match(setup,/proofAccountId/);
  assert.match(setup,/adminAclVerified/);
  assert.match(setup,/companyOauthFreshVerified/);
  assert.match(setup,/companyReady=personalReady&&companyOauthFreshVerified&&companyAdminReadReady/);
  assert.match(setup,/linkedin_company_admin_oauth_proven:companyReady/);
  assert.match(setup,/organization_write_scope_verified:companyReady&&hasOrgWriteScope/);
  assert.match(setup,/company_oauth_connection_id:companyReady\?accountId:null/);
  assert.match(setup,/company_live_proven_eligible:companyReady&&companyReadbackReady/);
});


const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('LinkedIn personal and company publish through Composio, never Buffer',()=>{
  assert.match(publisher,/publishLinkedInPersonalViaComposio/);
  assert.match(publisher,/publishLinkedInCompanyViaComposio/);
  assert.match(publisher,/transport_contract:'linkedin-composio-direct-v2'/);
  assert.doesNotMatch(publisher,/row\.channel === 'linkedin_company' && bufferCircuit\.active/);
  assert.doesNotMatch(publisher,/await markLinkedInRateLimited\(db,runDate,bufferCircuit\)/);
});

test('LinkedIn company Composio publishing is exact-readback and fail-closed',()=>{
  assert.match(publisher,/COMPOSIO_LINKEDIN_COMPANY_EXACT_READBACK_MISMATCH/);
  assert.match(publisher,/COMPOSIO_LINKEDIN_COMPANY_AUTHOR_AMBIGUOUS/);
  assert.match(publisher,/republish_forbidden:true/);
  assert.match(publisher,/do not fall back to Buffer or issue a replacement post/);
});


test('LinkedIn company publisher binds exact fresh OAuth state and approved organization ACL', () => {
  assert.match(publisher,/state\?\.company_oauth_connection_id\|\|state\?\.connected_account_id/);
  assert.match(publisher,/state\?\.company_oauth_fresh_verified===true/);
  assert.match(publisher,/state\?\.linkedin_company_admin_oauth_proven===true/);
  assert.match(publisher,/state\?\.organization_write_scope_verified===true/);
  assert.match(publisher,/LINKEDIN_COMPANY_BOUND_OAUTH_NOT_ACTIVE/);
  assert.match(publisher,/LINKEDIN_COMPANY_ADMIN_ROLE_REQUIRED/);
  assert.match(publisher,/findExpectedLinkedInPersonId\(me\?\.data\|\|me,expectedPersonId\)/);
  assert.doesNotMatch(publisher,/findExpectedLinkedInPersonId\(me\?\.data\|\|me,'N1twnCNCrD'\)/);
});


test('LinkedIn production setup reuses scoped production auth lineage and resumes the same daily claim',()=>{
  assert.match(setup,/action==='create_link'/);
  assert.match(setup,/toolkit_slug=linkedin/);
  assert.match(setup,/proofAuthConfigId/);
  assert.match(setup,/proofUserId/);
  assert.match(setup,/auth_config_id:authConfigId,user_id:linkUserId,alias:ALIAS/);
  assert.match(setup,/production_workspace:true/);
  assert.match(setup,/action==='resume'/);
  assert.match(setup,/linkedin-production-oauth-complete/);
  assert.match(setup,/powerhouse-social-publisher/);
});

const liveProofState=fs.readFileSync('supabase/migrations/20261006103856_linkedin_company_live_proof_state_canonical_v3.sql','utf8');

test('LinkedIn company LIVE_PROVEN requires fresh OAuth, write scope and exact provider truth',()=>{
  assert.match(liveProofState,/p_channel='linkedin_company'/);
  assert.match(liveProofState,/provider_truth_verified/);
  assert.match(liveProofState,/linkedin_company_admin_oauth_proven/);
  assert.match(liveProofState,/organization_write_scope_verified/);
  assert.match(liveProofState,/company_oauth_fresh_verified/);
  assert.match(liveProofState,/company_oauth_connection_id/);
  assert.match(liveProofState,/company_oauth_verified_at/);
  assert.match(liveProofState,/urn:li:organization:18234216/);
  assert.match(liveProofState,/LINKEDIN_COMPANY_FRESH_ORG_OAUTH_PROOF_REQUIRED/);
});

test('LinkedIn company exact readback promotes to LIVE_PROVEN, not provider-create alone',()=>{
  assert.match(publisher,/const obligationState=exactReadbackVerified\?'LIVE_PROVEN':'PUBLISHED'/);
  assert.match(publisher,/recordObligation\(db,runDate,row\.channel,'LIVE_PROVEN',ref,evidence/);
  assert.match(publisher,/company_oauth_fresh_verified:companyOauthFreshVerified===true/);
});
