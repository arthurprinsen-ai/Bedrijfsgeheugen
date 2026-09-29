import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('LinkedIn company selector accepts canonical organization URN and numeric id representations',()=>{
  assert.match(publisher,/const targetOrgId=targetOrg\.replace\(\/\^urn:li:organization:\/,'',?\)/);
  assert.match(publisher,/raw\.includes\(targetOrg\)/);
  assert.match(publisher,/raw\.includes\(targetOrgId\)/);
});

test('canonical Bedrijfsgeheugen organization remains the fallback authority',()=>{
  assert.match(publisher,/urn:li:organization:18234216/);
  assert.match(publisher,/LINKEDIN_GET_COMPANY_INFO/);
  assert.match(publisher,/w_organization_social/);
});
