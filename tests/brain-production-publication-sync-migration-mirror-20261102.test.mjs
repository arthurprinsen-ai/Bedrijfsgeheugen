import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const restored=await readFile(new URL('../supabase/migrations/20261031135451_publication_sync_preserve_recovery_handoff_v1.sql',import.meta.url),'utf8');
const earlier=await readFile(new URL('../supabase/migrations/20261031133000_publication_sync_preserve_recovery_handoff_v1.sql',import.meta.url),'utf8');

test('recovered original production-applied SQL is exact, non-placeholder historical mirror',()=>{
  assert.equal(restored,earlier,'production ledger 20261031135451 statements[1] is byte-identical to original 20261031133000');
  assert.ok(restored.length>2800);
  assert.match(restored,/CREATE OR REPLACE FUNCTION public\.sync_content_publication_obligations/);
  assert.match(restored,/REVOKE EXECUTE ON FUNCTION public\.sync_content_publication_obligations\(date,date\)/);
});

test('restored provider history preserves original publisher owner recovery and no parallel writer',()=>{
  assert.match(restored,/ON CONFLICT \(tenant_id,publication_date,channel\) do update/i);
  assert.match(restored,/set experiment_id=excluded\.experiment_id/);
  assert.doesNotMatch(restored,/set[\s\S]{0,220}next_action\s*=/i);
  assert.match(restored,/content_publication_obligations\.experiment_id,/);
  assert.doesNotMatch(restored,/CREATE TABLE|CREATE EXTENSION|GRANT EXECUTE TO (anon|authenticated)|\bcron\.schedule\b/i);
});
