import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261115162000_personal_observation_source_no_resurrection_v1.sql',import.meta.url),'utf8');
test('original secured source rotator unchanged authority',()=>{
 for(const s of ['CREATE OR REPLACE FUNCTION public.powerhouse_ensure_personal_source_rotation_v2(p_date date)','SECURITY DEFINER',"SET search_path TO 'public', 'pg_catalog'",'revoke execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) from public, anon, authenticated','grant execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) to service_role, postgres']) assert.ok(sql.toLowerCase().includes(s.toLowerCase()),s);
 assert.ok(!sql.includes('cron.schedule'));assert.ok(!sql.includes('net.http_post'));
});
test('truthful original conflict receipt, no skip resurrection',()=>{
 for(const s of ['on conflict (dedupe_key) do nothing','get diagnostics v_rows = row_count','existing_original_source_claim_preserved','SOURCE_ALREADY_CONSUMED_OR_QUARANTINED',"or r.dedupe_key='observational-personal-theme:'||p_date::text||':'||s.signal_id::text"]) assert.ok(sql.includes(s),s);
 assert.ok(!sql.includes('on conflict (dedupe_key) do update'));
});
test('never consume truncated or previously quarantined source',()=>{
 for(const s of ['original_source_quarantine','length(trim(s.excerpt)) >= 240',"right(trim(s.excerpt),3) <> '...'","right(trim(s.excerpt),1) <> '…'",'s.total_score >= 0.72',"s.source_url like 'https://%'","s.source_published_at::date between (p_date - 45) and p_date","'source_lineage'","'first_person_claims_present',false"]) assert.ok(sql.includes(s),s);
});
