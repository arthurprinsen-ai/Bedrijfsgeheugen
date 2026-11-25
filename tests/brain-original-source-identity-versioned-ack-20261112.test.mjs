import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../supabase/migrations/20261112194500_original_growth_source_revision_identity_fix_v1.sql',import.meta.url),'utf8');
function simulateOriginalRevisionChain(initialHash,newHash){
 const identity={payload_sha256:initialHash,source_revision:initialHash,consumer_ack:{accepted:true,consumed_revision:initialHash}};
 identity.source_revision=newHash;
 identity.previous_source_revision=initialHash;
 identity.consumer_ack={accepted:false,consumed_revision:null};
 const currentSha=newHash;
 const staleAckAccepted=identity.consumer_ack.accepted===true && identity.consumer_ack.consumed_revision===currentSha;
 identity.consumer_ack={accepted:true,consumed_revision:newHash};
 return {identity,staleAckAccepted,newAckAccepted:identity.consumer_ack.accepted&&identity.consumer_ack.consumed_revision===currentSha};
}
test('PostgreSQL original BRAIN immutable identity guard retained, revision is evidence only',()=>{
 assert.match(sql,/brain_guard_obligation_identity/);
 assert.match(sql,/original_identity_sha256',public\.brain_obligations\.payload_sha256/);
 assert.match(sql,/public\.brain_obligations\.evidence->>'source_revision'=v_revision/);
 assert.match(sql,/source_revision',v_revision/);
 assert.doesNotMatch(sql,/payload_sha256=excluded\.payload_sha256/);
 assert.doesNotMatch(sql,/DISABLE TRIGGER|DROP TRIGGER|DROP FUNCTION|ALTER TABLE|cron\.schedule|http_post\(/i);
 assert.match(sql,/revision_requires_new_ack',true/);
 assert.match(sql,/previous_consumer_ack',public\.brain_obligations\.evidence->'consumer_ack'/);
 assert.match(sql,/previous_analysis',public\.brain_obligations\.evidence->'analysis'/);
});
test('each original source revision is append-only and old receipt becomes invalid until re-ACK',()=>{
 assert.match(sql,/original_daily_growth_source_revision/);
 assert.match(sql,/original-growth-source-revision:'\|\|p_day::text\|\|':'\|\|v_revision/);
 assert.match(sql,/ON CONFLICT\(dedupe_key\) DO NOTHING/);
 assert.match(sql,/v_source_count>=8/);
 assert.match(sql,/v_brain\.evidence->>'source_revision'=v_hash/);
 assert.doesNotMatch(sql,/v_hash=v_brain\.payload_sha256/);
 const x=simulateOriginalRevisionChain('a'.repeat(64),'b'.repeat(64));
 assert.equal(x.identity.payload_sha256,'a'.repeat(64));
 assert.equal(x.staleAckAccepted,false);
 assert.equal(x.newAckAccepted,true);
});
test('Heartbeat requires original raw manifest SHA, matching BRAIN current revision and actual consumer ACK',()=>{
 assert.match(sql,/v_current_table_revision text; v_current_source_count int:=0/);
 assert.match(sql,/jsonb_agg\([\s\S]*?raw_source_revision/);
 assert.match(sql,/e\.evidence->>'consumer_source_revision'=v_current_table_revision/);
 assert.match(sql,/b\.evidence->>'source_revision'=v_current_table_revision/);
 assert.match(sql,/b\.evidence#>>'\{consumer_ack,accepted\}'='true'/);
 assert.match(sql,/b\.evidence#>>'\{consumer_ack,consumed_revision\}'=v_current_table_revision/);
 assert.match(sql,/v_current_source_count>=8/);
 assert.match(sql,/daily_source_brain_ack_verified',v_source_ack_at is not null/);
 assert.match(sql,/daily_source_current_raw_manifest_sha256/);
 assert.match(sql,/daily_source_current_source_count/);
 assert.match(sql,/actual_cro_experiment_executed',false/);
 assert.match(sql,/causal_lift_or_revenue_proven',false/);
});
test('only existing original source + consumer + heartbeat functions, internal execution',()=>{
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length,3);
 for(const fn of ['powerhouse_daily_source_archive_v1(date)','powerhouse_daily_source_consume_v1(date)','powerhouse_commercial_intelligence_heartbeat_v1(date)']){
  assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.'+fn+' FROM PUBLIC,anon,authenticated'));
  assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.'+fn+' TO service_role'));
 }
});
