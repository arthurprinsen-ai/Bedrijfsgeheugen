import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration='supabase/migrations/20260915110000_powerhouse_internal_view_security_hardening.sql';

test('internal Powerhouse views are invoker-only and browser roles are revoked',()=>{
  const sql=readFileSync(migration,'utf8');
  for (const view of [
    'powerhouse_revenue_flywheel_v1',
    'powerhouse_outcome_sweep_queue_v1',
    'powerhouse_experiment_decision_queue_v1'
  ]) {
    assert.match(sql,new RegExp(`alter view public\\.${view} set \\(security_invoker = true\\)`,'i'));
    assert.match(sql,new RegExp(`revoke all on (?:table )?public\\.${view} from public, anon, authenticated`,'i'));
    assert.match(sql,new RegExp(`grant select on (?:table )?public\\.${view} to service_role`,'i'));
  }
  assert.match(sql,/powerhouse-internal-view-browser-exposure-v1/i);
  assert.match(sql,/brain_failure_registry/i);
});