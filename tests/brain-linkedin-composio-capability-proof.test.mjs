import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const setup=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const loop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');

test('LinkedIn capability discovery is read-only and uses active Composio account',()=>{
  assert.match(setup,/toolkit_slugs=linkedin&statuses=ACTIVE/);
  assert.match(setup,/LINKEDIN_GET_MY_INFO/);
  assert.match(setup,/LINKEDIN_GET_COMPANY_INFO/);
  assert.match(setup,/COMPANY_SCOPE_TOOLS=.*LINKEDIN_GET_COMPANY_INFO.*LINKEDIN_CREATE_LINKED_IN_POST.*LINKEDIN_GET_POST_CONTENT/);
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
const migration=fs.readFileSync('supabase/migrations/20261006113430_linkedin_company_live_proven_resume_guards_v1.sql','utf8');

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


test('LinkedIn company requires a fresh bound organization-admin OAuth before publish', () => {
  assert.match(setup,/COMPANY_REQUIRED_SCOPES=.*r_organization_admin.*w_organization_social/);
  assert.match(setup,/oauth_candidate_connection_id:connectedAccountId/);
  assert.match(setup,/boundOauthAccountId=clean\(proofAccountId\|\|priorState\?\.company_oauth_connection_id\|\|priorState\?\.oauth_candidate_connection_id\)/);
  assert.match(setup,/accountsToCheck=proofAccountId/);
  assert.match(setup,/COMPOSIO_LINKEDIN_FRESH_PROOF_ACCOUNT_NOT_ACTIVE/);
  assert.match(setup,/organizationAdminScopeAuthorized/);
  assert.match(setup,/organizationWriteScopeAuthorized/);
  assert.match(setup,/companyOauthFreshVerified=.*organizationAdminScopeAuthorized&&organizationWriteScopeAuthorized/);
  assert.match(setup,/companyReady=personalReady&&companyOauthFreshVerified&&companyAdminReadReady/);
  assert.match(setup,/organization_write_scope_authorized:organizationWriteScopeAuthorized/);
  assert.match(setup,/organization_write_scope_verified:false/);
  assert.match(setup,/company_publish_eligible:companyReady/);
  assert.match(setup,/company_live_proven_eligible:false/);
  assert.match(publisher,/LINKEDIN_COMPANY_FRESH_ORG_OAUTH_REQUIRED/);
  assert.match(publisher,/state\?\.company_oauth_fresh_verified===true/);
  assert.match(publisher,/organization_write_scope_authorized/);
  assert.match(loop,/if\(channel==='linkedin_company'&&status==='PUBLISHED'\)return false/);
});


test('LinkedIn production setup can create OAuth link and resume the same daily claim',()=>{
  assert.match(setup,/action==='create_link'/);
  assert.match(setup,/toolkit_slug=linkedin/);
  assert.match(setup,/auth_config_id:authConfigId,user_id:linkUserId,alias:ALIAS/);
  assert.match(setup,/production_workspace:true/);
  assert.match(setup,/action==='resume'/);
  assert.match(setup,/linkedin-production-oauth-complete/);
  assert.match(setup,/powerhouse-social-publisher/);
});


test('current-main publisher hardening survives LinkedIn OAuth recovery',()=>{
  assert.match(publisher,/function jsonObject\(value:any\)/);
  assert.match(publisher,/findExpectedLinkedInPersonId/);
  assert.match(publisher,/delivery_evidence: jsonObject\(row\.delivery_evidence\)/);
  assert.match(publisher,/generation_evidence: jsonObject\(artifact\.generation_evidence\)/);
});

test('organization write is proven only by a real provider create and exact readback',()=>{
  assert.match(publisher,/provider_create_success:true/);
  assert.match(publisher,/organization_write_scope_verified:true/);
  assert.match(publisher,/liveProven=exactReadbackVerified&&direct\.linkedin_company_admin_oauth_proven===true&&direct\.organization_write_scope_verified===true&&direct\.company_oauth_fresh_verified===true/);
  assert.match(publisher,/liveProven\?'LIVE_PROVEN':'PUBLISHED'/);
});

test('explicit provider auth failure remains resumable without fabricating a side effect',()=>{
  assert.match(publisher,/linkedin-composio-direct-v3-auth-resumable/);
  assert.match(publisher,/provider_create_success:false/);
  assert.match(publisher,/possible_provider_side_effect:false/);
  assert.match(publisher,/state:'content_ready'/);
  assert.match(publisher,/republish_forbidden:false/);
});

test('company provider truth is stricter than a provider acknowledgement',()=>{
  assert.match(loop,/evidence\?\.provider_truth_verified===true/);
  assert.match(loop,/evidence\?\.linkedin_company_admin_oauth_proven===true/);
  assert.match(loop,/evidence\?\.organization_write_scope_verified===true/);
  assert.match(loop,/evidence\?\.company_oauth_fresh_verified===true/);
});


test('OAuth setup preserves structured Composio errors instead of object-string loss',()=>{
  assert.match(setup,/function composioErrorText/);
  assert.match(setup,/JSON\.stringify\(value\)/);
  assert.doesNotMatch(setup,/clean\(b\?\.error\|\|b\?\.message\|\|JSON\.stringify\(b\)\)/);
});


test('durable fresh OAuth proof wins over stale candidate state',()=>{
  assert.match(setup,/COMPANY_PROOF_RECORD='linkedin-company-oauth-fresh-proof-v1'/);
  assert.match(setup,/record_id',COMPANY_PROOF_RECORD/);
  assert.match(setup,/proofFresh=freshProof\?\.verified===true&&freshProof\?\.fresh_oauth_verified===true/);
  assert.match(setup,/proofAccountId=proofFresh\?clean\(freshProof\?\.connected_account_id\):''/);
  assert.match(setup,/accountsToCheck=proofAccountId/);
  assert.match(setup,/proofAccountId&&accountsToCheck\.length!==1/);
  assert.match(setup,/proofBound=proofFresh/);
  assert.match(setup,/accountId===proofAccountId/);
  assert.match(setup,/freshProof\?\.admin_acl_verified===true/);
});


test('company publisher binds identity to provider-verified setup state instead of a hardcoded person id',()=>{
  assert.ok(publisher.includes("const expectedPersonUrn=clean(state?.personal_author_urn)||'urn:li:person:N1twnCNCrD';"));
  assert.ok(publisher.includes("const expectedPersonId=expectedPersonUrn.replace(/^urn:li:person:/,'');"));
  assert.ok(publisher.includes("const personId=findExpectedLinkedInPersonId(me?.data||me,expectedPersonId);"));
  assert.ok(!publisher.includes("findExpectedLinkedInPersonId(me?.data||me,'N1twnCNCrD');"));
});

test('company readback accepts only exact canonical normalized commentary when LinkedIn rewrites presentation',()=>{
  assert.ok(publisher.includes('async function linkedInCompanyCommentaryMatches'));
  assert.ok(publisher.includes("db.rpc('powerhouse_normalize_publication_text_v1',{p_text:expectedClean})"));
  assert.ok(publisher.includes("db.rpc('powerhouse_normalize_publication_text_v1',{p_text:observedClean})"));
  assert.ok(publisher.includes("const truth=idMatch&&authorMatch&&lifecycleState==='PUBLISHED'&&commentaryMatch;"));
  assert.ok(publisher.includes("COMPOSIO_LINKEDIN_COMPANY_EXACT_RECONCILE_MISMATCH"));
});

test('reconciled LinkedIn company becomes LIVE_PROVEN only with provider truth plus fresh org proof',()=>{
  assert.ok(publisher.includes("const liveProven=direct.provider_truth_verified===true"));
  assert.ok(publisher.includes("evidence.linkedin_company_admin_oauth_proven===true"));
  assert.ok(publisher.includes("evidence.organization_write_scope_verified===true"));
  assert.ok(publisher.includes("evidence.company_oauth_fresh_verified===true"));
  assert.ok(publisher.includes("liveProven?'LIVE_PROVEN':'PUBLISHED'"));
});

test('same daily claim is idempotent on exact normalized content and still rejects changed normalized content',()=>{
  assert.ok(migration.includes('if v_existing.normalized_hash=v_norm_hash then'));
  assert.ok(migration.includes("'CLAIM_ALREADY_RESERVED_SAME_CONTENT'"));
  assert.ok(migration.includes("'CLAIM_ALREADY_RESERVED_DIFFERENT_CONTENT'"));
  assert.ok(!migration.includes('if v_existing.raw_hash=v_raw_hash\n       and v_existing.normalized_hash=v_norm_hash'));
});

test('expired unconsumed publication capability is reclaimable while consumed capability remains a hard daily fence',()=>{
  assert.ok(migration.includes('and consumed_at is null'));
  assert.ok(migration.includes('and expires_at<=now()'));
  assert.ok(migration.includes("'EXPIRED_UNCONSUMED_LEASE_AUTO_REVOKED'"));
  assert.ok(migration.includes("'DAILY_CHANNEL_PUBLICATION_ALREADY_CONSUMED'"));
  assert.ok(migration.includes("'DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED'"));
});
