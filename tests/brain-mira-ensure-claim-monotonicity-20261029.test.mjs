import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20261029183000_instagram_media_ensure_claim_monotonicity_v1.sql','utf8');
const conflict=sql.split('on conflict (tenant_id,publication_date,channel) do update set')[1]?.split('returning id into v_id;')[0];
test('existing media ensure cannot erase independent rejected OpenArt history',()=>{
  assert.ok(conflict,'preserve original daily-winner ensure');
  assert.match(conflict,/where public\.powerhouse_instagram_media_jobs_v1\.status in \('QUEUED','WAITING_ASSET','WAITING_PROVIDER_CONNECTION'\)/);
  assert.match(conflict,/coalesce\(public\.powerhouse_instagram_media_jobs_v1\.attempts,0\)=0/);
  assert.match(conflict,/public\.powerhouse_instagram_media_jobs_v1\.last_error is null/);
  for(const field of ['openart_history_id','openart_resource_id','asset_url']){
    assert.ok(conflict.includes("asset_manifest->>'"+field+"'"),field);
  }
  assert.match(conflict,/coalesce\(public\.powerhouse_instagram_media_jobs_v1\.proof_manifest,'\{\}'::jsonb\)='\{\}'::jsonb/);
  assert.match(conflict,/republish_forbidden=false/);
  assert.ok(conflict.indexOf('where public.powerhouse_instagram_media_jobs_v1.status')>conflict.indexOf('updated_at=now()'));
});
test('protected candidate remains same job and retry count without mutation',()=>{
  assert.match(sql,/if v_id is null then\s+select id into v_id from public\.powerhouse_instagram_media_jobs_v1/);
  assert.match(sql,/where tenant_id='canonical' and publication_date=p_date and channel='instagram'/);
  assert.match(sql,/if v_id is null then raise exception 'INSTAGRAM_MEDIA_JOB_ENSURE_ID_MISSING'/);
  assert.doesNotMatch(sql,/set attempts\s*=|set last_error\s*=|set status\s*=/i);
});
test('security and single-authority boundaries unchanged',()=>{
  assert.match(sql,/SECURITY DEFINER/i);
  assert.match(sql,/revoke all on function public\.powerhouse_ensure_instagram_media_job_v1\(date\) from public,anon,authenticated/);
  assert.match(sql,/grant execute on function public\.powerhouse_ensure_instagram_media_job_v1\(date\) to postgres,service_role/);
  assert.doesNotMatch(sql,/cron\.schedule|create table|create trigger|net\.http_post|publish_to_instagram|instagram_create_media/i);
});
test('regression: the original quality rejection is never reclassified by the ensure owner',()=>{
  const waitingProof='WAITING_PROOF',waitingAssetWithClaim={status:'WAITING_ASSET',attempts:1,history:'i6e9teMFpPH7YwZG4PMS'};
  assert.ok(!['QUEUED','WAITING_ASSET','WAITING_PROVIDER_CONNECTION'].includes(waitingProof));
  assert.ok(waitingAssetWithClaim.attempts>0&&waitingAssetWithClaim.history);
  assert.match(sql,/WAITING_ASSET carrying a provider history is NOT an empty media slot/);
});
