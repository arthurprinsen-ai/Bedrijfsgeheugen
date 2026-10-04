import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20261004132500_linkedin_channel_role_learning_v1.sql','utf8');

test('weak absolute engagement is not promoted as a winner',()=>{
  assert.match(sql,/response is zeer laag|respons is zeer laag/);
  assert.match(sql,/100\.0\*v_reacties\/v_impressies/);
});
test('personal and company LinkedIn remain separate experiment arms',()=>{
  assert.match(sql,/linkedin_personal/);
  assert.match(sql,/linkedin_company/);
  assert.match(sql,/Cross-posten of dezelfde copy hergebruiken is verboden/);
});
test('personal LinkedIn cannot inherit commercial CTA optimization',()=>{
  assert.match(sql,/persoonlijk LinkedIn blijft vrij van zakelijke CTA/);
});
