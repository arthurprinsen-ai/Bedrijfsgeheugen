import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hardening=fs.readFileSync('supabase/migrations/20260831_brain_production_truth_hardening.sql','utf8');

test('Production Truth has no service_role table-write bypass around reconciliation',()=>{
  assert.match(hardening,/alter function public\.brain_reconcile_production_truth\(text,text,text,timestamptz\)[\s\S]*security definer/i,'reconcile must be the privileged mutation boundary');
  assert.match(hardening,/revoke insert, update, delete, truncate on table public\.brain_production_truth from service_role/i,'service_role direct truth writes must be revoked');
  assert.match(hardening,/grant select on table public\.brain_production_truth to service_role/i,'service_role may read derived truth');
  assert.doesNotMatch(hardening,/grant[\s\S]{0,80}(insert|update|delete|truncate)[\s\S]{0,80}brain_production_truth[\s\S]{0,40}service_role/i,'hardening must not regrant direct truth writes');
});
