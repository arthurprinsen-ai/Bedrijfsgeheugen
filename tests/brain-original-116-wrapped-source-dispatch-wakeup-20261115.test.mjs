import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../supabase/migrations/20261115121500_original_wrapped_serp_source_dispatch_wakeup_v1.sql',import.meta.url),'utf8');
const edge=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');

test('EXISTING #116 source dispatcher wakes original worker when all other due queues empty',()=>{
 assert.match(migration,/create or replace function public\.powerhouse_dispatch_relationship_public_research_v1\(p_run_date date/i);
 assert.match(migration,/v_due_wrapped_source_review boolean := false/);
 assert.match(migration,/coalesce\(a\.evidence#>>'\{public_research_execution,source_url\}',a\.source_url,''\)/);
 assert.match(migration,/google\[\.\]\[a-z\.\]\+\/\(goto\|url\|aclk\)/);
 assert.match(migration,/a\.status='done'/);
 assert.match(migration,/a\.dedupe_key like 'relationship-research:outreach-source:%'/);
 assert.match(migration,/a\.created_at>=now\(\)-interval '7 days'/);
 assert.match(migration,/o\.status in \('prepared','waiting'\)/);
 assert.match(migration,/o\.evidence#>>'\{execution_gate,reason\}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'/);
 assert.match(migration,/not v_first_party_due and not v_due_original_retry\s+and not v_due_wrapped_source_review then/);
 assert.match(migration,/'due_wrapped_source_review',v_due_wrapped_source_review/);
 assert.match(migration,/net\.http_post\(/);
 assert.match(migration,/powerhouse_daily_scheduler_token/);
 assert.match(migration,/x-powerhouse-token/);
});
test('only currently non-sent exact original recipient may cause correction wake',()=>{
 for(const bit of [
 "o.action_id::text=a.evidence->>'original_outreach_action_id'",
 "o.person_key=a.person_key",
 "o.company_key=a.company_key",
 "o.action_type='autonomous_email'",
 "o.channel='email'",
 "nullif(o.evidence#>>'{autonomous_outbound,provider_message_id}','') is null",
 "nullif(o.evidence#>>'{native_gmail_executor,provider_message_id}','') is null",
 "nullif(o.evidence->>'provider_message_id','') is null",
 "coalesce(o.evidence#>>'{autonomous_outbound,needs_readback}','false')<>'true'",
 "coalesce(o.evidence#>>'{autonomous_outbound,republish_forbidden}','false')<>'true'",
 "coalesce(o.evidence#>>'{provider_ambiguity_quarantine,external_resend_forbidden}','false')<>'true'"
 ])assert.ok(migration.includes(bit),'missing safety gate '+bit);
 assert.match(migration,/revoke execute on function public\.powerhouse_dispatch_relationship_public_research_v1\(date\) from public, anon, authenticated/);
 assert.match(migration,/grant execute on function public\.powerhouse_dispatch_relationship_public_research_v1\(date\) to service_role/);
 assert.doesNotMatch(migration,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|create table|create policy/i);
});

test('original old false green runtime event is quarantined before retry with same original event identity',()=>{
 assert.match(edge,/async function recoverWrappedOriginalResearchSources/);
 assert.match(edge,/if\(recovered>=5\)break/);
 assert.match(edge,/ORIGINAL_WRAPPED_SOURCE_EVENT_READ/);
 assert.match(edge,/\.eq\('event_type','relationship_public_research_evidence'\)/);
 assert.match(edge,/\.like\('dedupe_key','relationship-public-research:'\+a\.action_id\+':%'\)/);
 assert.match(edge,/\.eq\('evidence->>source_url',source\)/);
 assert.match(edge,/data_quality:'REJECTED_TRACKING_REDIRECT'/);
 assert.match(edge,/state:'error'/);
 assert.match(edge,/original_source_quality_correction/);
 assert.match(edge,/source_page_independently_read:false/);
 assert.match(edge,/provider_send_authorized:false,external_send_executed:false/);
 assert.match(edge,/\.eq\('updated_at',prior\.updated_at\)/);
 assert.match(edge,/ORIGINAL_WRAPPED_SOURCE_EVENT_QUARANTINE/);
 const eventAt=edge.indexOf("ORIGINAL_WRAPPED_SOURCE_EVENT_QUARANTINE");
 const sourceAt=edge.indexOf("ORIGINAL_WRAPPED_SOURCE_SAFE_RETRY");
 assert.ok(eventAt>=0 && sourceAt>eventAt,'old event must be rejected BEFORE same-action retry');
 assert.match(edge,/researchNoSourceFeedback\(a,owner,observedAt,next\)/);
 assert.match(edge,/status:'SOURCE_REDIRECT_REJECTED_NOT_VERIFIED'/);
 assert.match(edge,/\.update\(\{status:'waiting',due_at:next,source_url:'',evidence,updated_at:observedAt\}\)/);
 assert.match(edge,/rejected_source_url:source/);
 assert.doesNotMatch(edge,/\.update\(\{status:'waiting',due_at:next,source_url:null,evidence,updated_at:observedAt\}\)/);
 assert.match(edge,/external_outreach_executed:false,new_scheduler:false,new_provider_queries:0/);
 assert.doesNotMatch(edge,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|GMAIL_CREATE_DRAFT/);
});
