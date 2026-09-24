import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const setup=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const loop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');

test('LinkedIn capability discovery is read-only and uses active Composio account',()=>{
  assert.match(setup,/toolkit_slugs=linkedin&statuses=ACTIVE/);
  assert.match(setup,/LINKEDIN_GET_MY_INFO/);
  assert.match(setup,/LINKEDIN_GET_COMPANY_INFO/);
  assert.doesNotMatch(setup,/LINKEDIN_CREATE_LINKED_IN_POST/);
  assert.doesNotMatch(setup,/LINKEDIN_CREATE_VIDEO_POST/);
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
  assert.match(setup,/execute\(key,accountId,userId,'LINKEDIN_GET_MY_INFO'/);
  assert.match(setup,/execute\(key,accountId,userId,'LINKEDIN_GET_COMPANY_INFO'/);
});

test('company capability stays fail-closed when organization scope is absent',()=>{
  assert.match(setup,/company_scope_required:companyReady\?null:\[/);\n  assert.match(setup,/r_organization_admin/);\n  assert.match(setup,/w_organization_social/);\n  assert.match(setup,/company_admin_scope_present:hasOrgAdminScope/);\n  assert.match(setup,/company_write_scope_present:hasOrgWriteScope/);
  assert.match(setup,/granted_scopes:grantedScopes/);
  assert.match(setup,/company_ready:companyReady/);
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
