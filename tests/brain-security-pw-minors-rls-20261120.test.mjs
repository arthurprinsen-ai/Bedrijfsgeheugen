import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261120134537_security_pw_mo14_private_player_data_20261120.sql','utf8');
const previous=readFileSync('supabase/migrations/20260903085305_pw_mo14_beoordelingen_intake.sql','utf8');

test('original anonymous exposure is eliminated by a targeted reversible privilege and RLS correction',()=>{
 for(const table of ['pw_beoordelingen','pw_opstellingen']){
  assert.match(previous,new RegExp('create table if not exists public\\.'+table));
  assert.match(sql,new RegExp('ALTER TABLE public\\.'+table+' ENABLE ROW LEVEL SECURITY;','i'));
  assert.match(sql,new RegExp('REVOKE ALL PRIVILEGES ON TABLE public\\.'+table+' FROM anon, authenticated;','i'));
  for(const action of ['insert','select'])assert.match(sql,new RegExp('DROP POLICY IF EXISTS '+table+'_'+action+'_anon ON public\\.'+table+';','i'));
 }
 assert.doesNotMatch(sql,/\b(?:DROP TABLE|TRUNCATE|DELETE FROM|UPDATE [\w.]+ SET)\b/i);
 assert.doesNotMatch(sql,/\bGRANT\b[^\n]*(?:anon|authenticated)/i);
});
test('existing production data and service role are not deleted or written by the migration',()=>{
 assert.match(sql,/BEGIN;/);
 assert.match(sql,/COMMIT;/);
 assert.match(sql,/Server-authorized access only/);
 assert.doesNotMatch(sql,/\bREVOKE\b[^\n]*\bservice_role\b/i);
 assert.doesNotMatch(sql,/\bDROP\s+SCHEMA\b/i);
});
