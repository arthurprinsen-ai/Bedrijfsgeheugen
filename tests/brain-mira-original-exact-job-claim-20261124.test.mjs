import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const router=read('supabase/functions/powerhouse-instagram-media-router/index.ts');
const migration=read('supabase/migrations/20261124063700_mira_original_exact_job_claim_v1.sql');
test('exact original claim is inside authenticated router and existing prespend gates',()=>{
 assert.ok(router.indexOf("error:'UNAUTHORIZED'")<router.indexOf("if(action==='claim_generation')"));
 const block=router.slice(router.indexOf("if(action==='claim_generation')"),router.indexOf("   return json({ok:eligible"));
 for(const token of ["!eligible","!initialFrozenLibrary","runDate!==today()","clean(input.job_id)!==clean(job?.id)","quote>640","!ready('openart')","MIRA_MASTER_REFERENCE_ID","MIRA_MASTER_REFERENCE_URL","MEDIA_ASSET_REQUIRED","WINNER_FROZEN","p_job_id:job.id","ORIGINAL_EXACT_CLAIM_NOT_ACQUIRED","approved_for_publish:false","actual_media_verified:false"])assert.ok(block.includes(token),token);
 assert.ok(!block.includes('generate_video('));
});
test('exact claim uses same exclusive row, cannot take a future job, retains deny-first ACL',()=>{
 for(const token of ["j.id=p_job_id","j.tenant_id='canonical'","j.channel='instagram'","j.publication_date=(now() AT TIME ZONE 'Europe/Amsterdam')::date","j.status='WAITING_ASSET'","j.attempts=0","FOR UPDATE OF j SKIP LOCKED","o.external_id IS NULL","o.live_proven_at IS NULL","o.evidence#>>'{veto,active}'","l.state='WINNER_FROZEN'","j.asset_manifest->>'openart_history_id'","FROM PUBLIC,anon,authenticated","TO service_role","attempts=attempts+1"])assert.ok(migration.includes(token),token);
 assert.ok(!migration.includes('DROP FUNCTION'));
});
test('original agents and both original skills require provider proof and analyst learning',()=>{
 for(const path of ['AGENTS.md','.agents/skills/instagram-composio-publisher/SKILL.md','.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md']){
  const src=read(path);for(const token of ['claim_generation','No shadow owner','24h/72h','null as unknown','7 consecutive days'])assert.ok(src.includes(token),path+': '+token);
 }
});
