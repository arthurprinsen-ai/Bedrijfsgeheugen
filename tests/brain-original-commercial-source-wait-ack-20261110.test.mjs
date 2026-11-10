import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261110134500_original_source_wait_is_not_send_v1.sql',import.meta.url),'utf8');
const guardStart=sql.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_email_suppression_guard_v1()');
const qualityStart=sql.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_assert_outbound_message_quality_v1()');
const sourceStart=sql.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_require_source_for_direct_outreach_v1()');
const guard=sql.slice(guardStart,qualityStart);
const quality=sql.slice(qualityStart,sourceStart);
const source=sql.slice(sourceStart);

test('only original three safety trigger functions; never scheduler, sender or queue',()=>{
 assert.ok(guardStart>0&&qualityStart>guardStart&&sourceStart>qualityStart);
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION /g)||[]).length,3);
 assert.equal((sql.match(/\$function\$;/g)||[]).length,3);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|GMAIL_SEND_EMAIL|insert into public\.powerhouse_sales_actions|update public\.powerhouse_sales_actions|DROP TRIGGER|DISABLE TRIGGER/i);
});

test('same exact bounded non-sending research WAIT contract across all three original guards',()=>{
 for(const [owner,section] of [['suppression',guard],['quality',quality],['source',source]]){
  for(const field of [
   "new.action_type='autonomous_email'",
   "new.status='waiting'",
   "new.evidence #>> '{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'",
   "new.evidence #>> '{commercial_closure,decision}'='WAIT_FOR_VERIFIED_SOURCE'",
   "new.evidence #>> '{commercial_closure,provider_send_forbidden}'='true'",
   "new.created_at>now()-interval '48 hours'",
   "new.created_at+interval '48 hours'",
   "new.evidence#>>'{commercial_closure,research_dedupe_key}'='relationship-research:outreach-source:'||new.action_id::text",
   "new.evidence#>>'{autonomous_outbound,provider_message_id}'",
   "new.evidence#>>'{autonomous_outbound,needs_readback}'",
   "new.evidence#>>'{autonomous_outbound,republish_forbidden}'",
   "new.evidence#>>'{provider_ambiguity_quarantine,external_resend_forbidden}'",
   "new.evidence->>'provider_ack_verified'",
   "new.evidence#>>'{native_gmail_executor,provider_message_id}'",
   "research.dedupe_key='relationship-research:outreach-source:'||new.action_id::text",
   "research.person_key=new.person_key",
   "research.company_key=new.company_key",
   "research.status in ('suggested','prepared','waiting','done')"
  ])assert.ok(section.includes(field),'missing '+owner+' guard for '+field);
 }
});

test('original suppression is checked BEFORE the safe WAIT exception; composer receipt still required for real provider claims',()=>{
 assert.ok(guard.indexOf('IF v_reason IS NOT NULL THEN')>=0);
 assert.ok(guard.indexOf('IF v_reason IS NOT NULL THEN')<guard.indexOf('IF v_claim_transition AND ('));
 assert.ok(guard.indexOf('IF v_claim_transition AND (')<guard.indexOf('IF v_claim_transition\n'));
 assert.match(guard,/new\.status:='skipped'/);
 assert.match(guard,/NO_PROSPECT_SPECIFIC_NOVEL_COPY_PROOF/);
 assert.match(guard,/new\.evidence:=coalesce\(new\.evidence,'\{\}'::jsonb\)\|\|jsonb_build_object\('send_forbidden',true\)/);
});

test('quality can waive WAIT solely for source research; DONE remains covered by original quality test',()=>{
 assert.ok(quality.indexOf('if (')<quality.indexOf("new.status in ('waiting','done')"));
 assert.match(quality,/new.status in \('waiting','done'\)/);
 assert.match(quality,/not coalesce\(public\.powerhouse_outbound_message_quality_ready_v1\(new\.action_id\),false\)/);
 assert.match(quality,/raise exception 'OUTBOUND_COPY_QUALITY_NOT_PROVEN/);
});

test('source gate stays fail closed for all unrelated actions; held source cannot become send-authorized',()=>{
 assert.match(source,/v_original_research_wait:=\(/);
 assert.match(source,/\(not has_source and not v_original_research_wait\)/);
 assert.match(source,/'source_gate',case when v_original_research_wait then 'PENDING_VERIFIED_SOURCE' else 'PASS' end/);
 assert.match(source,/'send_forbidden',v_original_research_wait/);
 assert.match(source,/new\.status:='skipped'/);
 assert.match(source,/'source_gate','FAIL'/);
 assert.match(source,/SECURITY DEFINER/);
 assert.match(source,/REVOKE ALL ON FUNCTION public\.powerhouse_require_source_for_direct_outreach_v1\(\)/);
 assert.match(source,/FROM PUBLIC, anon, authenticated/);
 assert.match(source,/GRANT EXECUTE ON FUNCTION public\.powerhouse_require_source_for_direct_outreach_v1\(\)/);
 assert.match(source,/TO service_role/);
});
