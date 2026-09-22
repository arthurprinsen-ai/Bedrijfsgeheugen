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
  assert.match(setup,/company_scope_required:companyReady\?null:'r_organization_admin'/);
  assert.match(setup,/granted_scopes:grantedScopes/);
  assert.match(setup,/company_ready:companyReady/);
});
