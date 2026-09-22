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
