import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261008100100_commercial_heartbeat_observation_ack_v1.sql','utf8');
const runner=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');

test('valid output observation, not commercial success, owns durable transport acknowledgement',()=>{
  assert.match(sql,/v_output_valid := coalesce\(v_output->>'contract',''\)='powerhouse-commercial-output-assurance-v3'/);
  assert.match(sql,/jsonb_typeof\(v_output->'commercial_day_proven'\)='boolean'/);
  assert.match(sql,/nullif\(v_output->>'commercial_day_state',''\) is not null/);
  assert.match(sql,/v_control_healthy := coalesce\(\(v_gate->>'healthy'\)::boolean,false\)\s+and v_output_valid/);
  assert.doesNotMatch(sql,/v_control_healthy := coalesce\(\(v_gate->>'healthy'\)::boolean,false\)\s+and coalesce\(\(v_output->>'healthy'\)::boolean,false\)/);
});

test('zero provider proof still remains observed, explicitly NOT commercial actioned',()=>{
  assert.match(sql,/v_proven := coalesce\(\(v_output->>'commercial_day_proven'\)::boolean,false\)/);
  assert.match(sql,/when v_proven then 'actioned'\s+else 'observed' end/);
  assert.match(sql,/'commercial_delivery_healthy',coalesce\(\(v_output->>'healthy'\)::boolean,false\)/);
  assert.match(sql,/'commercial_day_proven',v_proven/);
  assert.match(sql,/'commercial_day_state',v_output->>'commercial_day_state'/);
  assert.match(sql,/case when v_control_healthy then 'VERIFIED' else 'PARTIAL' end/);
});

test('external runner durably accepts valid observed state but not errors',()=>{
  assert.match(runner,/\["actioned","observed","done"\]/);
  assert.match(runner,/String\(receipt.data_quality\|\|""\)==="VERIFIED"/);
  assert.match(runner,/if\(!durable\)throw new Error\("HEARTBEAT_DURABLE_READBACK_MISSING"\)/);
});

test('no new scheduler, executor, auth grant or artificial provider proof',()=>{
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|insert into public\.powerhouse_sales_actions|insert into public\.powerhouse_sales_outcomes/i);
  assert.doesNotMatch(sql,/grant\s+execute|disable\s+row\s+level\s+security/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_commercial_heartbeat_v1\(timestamptz\) from public, anon, authenticated/);
  assert.doesNotMatch(sql,/set\s+commercial_day_proven\s*=\s*true/i);
});
