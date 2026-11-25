import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261008122000_powerhouse_infinity_action_fabric_digest_v1.sql',import.meta.url),'utf8');

test('Action Fabric resolves pgcrypto through the installed extensions schema',()=>{
  assert.match(sql,/extensions\.digest\(convert_to\(v_payload,'UTF8'\),'sha256'\)/);
});

test('Action Fabric remains fail closed until a canonical action exists',()=>{
  assert.match(sql,/v_action\.status in \('MATERIALIZED','DONE'\)/);
  assert.match(sql,/nullif\(v_action\.canonical_action_ref,''\) is not null/);
  assert.doesNotMatch(sql,/v_action\.status in \('READY','MATERIALIZED','DONE'\)/);
});

test('public callers cannot invoke either repaired production function',()=>{
  assert.match(sql,/revoke execute on function public\.powerhouse_materialize_intelligence_action_v1\(text,text\)/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_infinity_operating_loop_v1\(text,date\)/i);
});
