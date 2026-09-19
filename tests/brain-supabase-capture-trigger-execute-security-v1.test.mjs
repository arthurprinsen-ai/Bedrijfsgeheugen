import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='supabase/migrations/20260919123730_restrict_capture_trigger_execute_v1.sql';
const functions=[
  'powerhouse_capture_external_signal_v1',
  'powerhouse_capture_ga4_batch_v1',
  'powerhouse_capture_gsc_row_v1',
  'powerhouse_capture_legacy_portal_state_v1',
  'powerhouse_capture_linkedin_engagement_v1',
  'powerhouse_capture_portal_layer_v1',
  'powerhouse_capture_social_metric_v1',
];

test('trigger-only capture functions revoke direct client execution', async()=>{
  const sql=await readFile(path,'utf8');
  for(const fn of functions){
    assert.match(sql,new RegExp(`revoke execute on function public\\.${fn}\\(\\) from public, anon, authenticated;`,'i'));
    assert.match(sql,new RegExp(`grant execute on function public\\.${fn}\\(\\) to service_role;`,'i'));
  }
});
