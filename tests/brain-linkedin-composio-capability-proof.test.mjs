import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const setup=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const loop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');

test('LinkedIn capability discovery is read-only and uses active Composio account',()=>{
  assert.match(setup,/toolkit_slugs=linkedin&statuses=ACTIVE/);
  assert.match(setup,/LINKEDIN_GET_MY_INFO/);
  assert.match(setup,/LINKEDIN_GET_COMPANY_INFO/);
  assert.match(setup,/restrict_to_following_tools:\['LINKEDIN_GET_MY_INFO','LINKEDIN_GET_COMPANY_INFO','LINKEDIN_CREATE_LINKED_IN_POST','LINKEDIN_GET_POST_CONTENT'\]/);
  assert.doesNotMatch(setup,/execute\(key,[^\n]*'LINKEDIN_CREATE_LINKED_IN_POST'/);
  assert.doesNotMatch(setup,/execute\(key,[^\n]*'LINKEDIN_CREATE_VIDEO_POST'/);
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

test('company capability stays fail-closed when organization scope is absent',()=>{
  assert.match(setup,/company_scope_required:companyReady\?null:\[/);
  assert.match(setup,/r_organization_admin/);
  assert.match(setup,/w_organization_social/);
  assert.match(setup,/company_admin_scope_present:hasOrgAdminScope/);
  assert.match(setup,/company_write_scope_present:hasOrgWriteScope/);
  assert.match(setup,/granted_scopes:grantedScopes/);
  assert.match(setup,/company_ready:companyReady/);
});


const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const companyLiveProofGuard=fs.readFileSync('supabase/migrations/20261006102646_linkedin_company_admin_oauth_live_proof_guard_v1.sql','utf8');
const companyLiveProofHardGuard=fs.readFileSync('supabase/migrations/20261006102754_linkedin_company_org_oauth_live_proof_guard_v1.sql','utf8');

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


test('LinkedIn company requires fresh bound organization-admin OAuth proof before publish', () => {
  assert.match(setup,/COMPANY_OAUTH_SCOPES=.*r_organization_admin.*r_organization_social.*w_organization_social/);
  assert.match(setup,/credentials:\{scopes:COMPANY_OAUTH_SCOPES\.join\(','\)\}/);
  assert.match(setup,/oauth_candidate_connection_id:connectedAccountId/);
  assert.match(setup,/boundOauthAccountId=clean\(priorState\?\.oauth_candidate_connection_id\|\|priorState\?\.company_oauth_connection_id\)/);
  assert.match(setup,/companyOauthFreshVerified=freshOauthBound&&companyAdminReadReady&&hasOrgWriteScope/);
  assert.match(setup,/companyReady=personalReady&&companyOauthFreshVerified/);
  assert.match(setup,/linkedin_company_admin_oauth_proven:companyOauthFreshVerified/);
  assert.match(setup,/company_live_proven_eligible:companyOauthFreshVerified&&companyReadbackReady/);
  assert.match(publisher,/LINKEDIN_COMPANY_FRESH_ORG_OAUTH_REQUIRED/);
  assert.match(publisher,/state\?\.company_oauth_fresh_verified===true/);
  assert.match(publisher,/company_oauth_connection_id:accountId/);
  assert.match(publisher,/liveProven=exactReadbackVerified&&direct\.linkedin_company_admin_oauth_proven===true&&direct\.organization_write_scope_verified===true&&direct\.company_oauth_fresh_verified===true/);
  assert.match(publisher,/liveProven\?'LIVE_PROVEN':'PUBLISHED'/);
  assert.match(loop,/if\(channel==='linkedin_company'&&status==='PUBLISHED'\)return false/);
});

test('LinkedIn production setup can create OAuth link and resume the same daily claim',()=>{
  assert.match(setup,/action==='create_link'/);
  assert.match(setup,/toolkit_slug=linkedin/);
  assert.match(setup,/auth_config_id:authConfigId,user_id:USER_ID,alias:ALIAS/);
  assert.match(setup,/production_workspace:true/);
  assert.match(setup,/action==='resume'/);
  assert.match(setup,/linkedin-production-oauth-complete/);
  assert.match(setup,/powerhouse-social-publisher/);
});


test('database refuses LinkedIn company LIVE_PROVEN without admin OAuth and organization-write proof',()=>{
  assert.match(companyLiveProofGuard,/p_channel='linkedin_company'/);
  assert.match(companyLiveProofGuard,/LINKEDIN_COMPANY_ADMIN_OAUTH_PROOF_REQUIRED/);
  assert.match(companyLiveProofGuard,/linkedin_company_admin_oauth_proven/);
  assert.match(companyLiveProofGuard,/organization_write_scope_verified/);
  assert.match(companyLiveProofGuard,/company_oauth_connection_id/);
  assert.match(companyLiveProofGuard,/company_oauth_verified_at/);
});


test('hard database guard blocks LinkedIn company LIVE_PROVEN without exact provider and fresh OAuth proof',()=>{
  assert.match(companyLiveProofHardGuard,/enforce_linkedin_company_live_proof_v1/);
  assert.match(companyLiveProofHardGuard,/provider_truth_verified/);
  assert.match(companyLiveProofHardGuard,/linkedin_company_admin_oauth_proven/);
  assert.match(companyLiveProofHardGuard,/organization_write_scope_verified/);
  assert.match(companyLiveProofHardGuard,/company_oauth_fresh_verified/);
  assert.match(companyLiveProofHardGuard,/urn:li:organization:18234216/);
  assert.match(companyLiveProofHardGuard,/BLOCKED_PENDING_ORG_OAUTH_AND_EXACT_READBACK/);
});
