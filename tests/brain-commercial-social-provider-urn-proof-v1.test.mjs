import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261008104000_commercial_social_provider_urn_proof_v1.sql',import.meta.url),'utf8');

test('existing one Brain assurance owner is replaced, with internal SQL privileges retained',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_commercial_output_assurance_v1\(/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_commercial_output_assurance_v1\(date\) from public, anon, authenticated/i);
  assert.doesNotMatch(sql,/create\s+(or\s+replace\s+)?function\s+public\.powerhouse_commercial_heartbeat_v1/i);
});

test('company provider URN is provable without optional permalink only after strict provider proof',()=>{
  assert.match(sql,/p\.external_id ~ '\^urn:li:\(share\|ugcPost\)/);
  for(const key of ['provider_create_success','provider_truth_verified','provider_publication_ack_verified','company_oauth_fresh_verified','organization_write_scope_verified','linkedin_company_admin_oauth_proven']){
    assert.ok(sql.includes("p.evidence->>'"+key+"'"),key+' must be required');
  }
  assert.ok(sql.includes("urn:li:organization:18234216"));
});

test('blogs still require exact site URL; Instagram still requires visible Mira media proof',()=>{
  assert.ok(sql.includes("p.channel='blog' and p.canonical_url like 'https://www.bedrijfsgeheugen.nl/%'"));
  assert.ok(sql.includes("p.evidence->>'exact_final_media_proven'='true'"));
  assert.ok(sql.includes("p.evidence->>'mira_gate_passed'='true'"));
});

test('safe no-send never fabricates commercial output or revenue',()=>{
  assert.ok(sql.includes("'OPEN_NO_PROVEN_ACTION'"));
  assert.ok(sql.includes("v_proven := v_email+v_social+v_publications>0"));
  assert.ok(sql.includes("'provider_proven_publications',v_publications"));
  assert.doesNotMatch(sql,/update\s+public\.powerhouse_sales_actions/i);
});
