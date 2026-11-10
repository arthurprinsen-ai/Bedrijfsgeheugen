import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceVerifiedComposerHandoff} from '../supabase/functions/_shared/verified-research-composer-handoff.mjs';

const sql=readFileSync(new URL('../supabase/migrations/20261110140500_original_commercial_verified_research_resume_v1.sql',import.meta.url),'utf8');
const composer=readFileSync(new URL('../supabase/functions/powerhouse-commercial-message-composer/index.ts',import.meta.url),'utf8');
const sender=readFileSync(new URL('../supabase/functions/powerhouse-autonomous-outreach/index.ts',import.meta.url),'utf8');

test('original candidate RPC resumes a research-held, already-quality-passed draft without a second queue',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_message_candidates_v1/);
  assert.match(sql,/RETURNS SETOF public\.powerhouse_commercial_message_plan_v1/);
  assert.match(sql,/p\.status='waiting'/);
  assert.match(sql,/p\.evidence#>>'\{execution_gate,reason\}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'/);
  assert.match(sql,/r\.dedupe_key='relationship-research:outreach-source:'\|\|p\.action_id::text/);
  assert.match(sql,/r\.person_key=p\.person_key/);
  assert.match(sql,/r\.company_key=p\.company_key/);
  assert.match(sql,/r\.evidence#>>'\{original_outreach_action_id\}'=p\.action_id::text/);
  assert.match(sql,/r\.status='done'/);
  assert.match(sql,/r\.executed_at>=now\(\)-interval '14 days'/);
  assert.match(sql,/n\.url=r\.evidence#>>'\{public_research_execution,source_url\}'/);
  assert.match(sql,/n\.over_dit_bedrijf=true/);
  assert.match(sql,/n\.zekerheid>=70/);
  assert.match(sql,/n\.opgehaald_op>=now\(\)-interval '30 days'/);
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION[\s\S]*?TO service_role/);
  assert.doesNotMatch(sql,/CREATE\s+(?:TABLE|TRIGGER|EXTENSION)|cron\.schedule|net\.http_post/i);
});

test('existing composer does not silently filter an already-quality-passed WAITING action',()=>{
  const idx=composer.indexOf("rows=rows.filter((a:any)=>");
  const gate=composer.indexOf("const sourceGate=composerSourcePreflight(workingAction,workingAction.message_plan)");
  assert.ok(idx>=0&&gate>idx);
  const predicate=composer.slice(idx,idx+640);
  assert.match(predicate,/a\.status==='waiting'/);
  assert.match(predicate,/a\.evidence\?\.execution_gate\?\.reason==='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'/);
  assert.match(composer,/sourceVerifiedComposerHandoff\(workingAction,research,news,now\)/);
  assert.match(composer,/qv\.checks\.source_specific_evidence_ok===true/);
  assert.match(composer,/qv\.checks\.semantic_novelty_ok===true/);
  assert.match(composer,/update\.status='prepared';update\.due_at=now/);
});

test('verified company news is necessary; the restart is never a fabricated send approval',()=>{
  const now='2026-11-10T10:00:00.000Z';
  const id='1b1c1111-2222-4333-8444-555555555555';
  const url='https://example.org/news/canopy-company-hiring';
  const action={action_id:id,person_key:'person-verified',company_key:'company-verified',
    company_name:'Canopy Solutions',message_plan:{human_readable_context:false,source_trigger_relevance:false},
    evidence:{execution_gate:{reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'}}};
  const research={action_id:'a0b0cccc-2222-4333-8444-555555555555',
    person_key:action.person_key,company_key:action.company_key,status:'done',source_url:url,
    executed_at:'2026-11-10T08:00:00Z',
    evidence:{original_outreach_action_id:id,public_research_execution:{
      contract:'powerhouse-relationship-research-auto-enrichment-v1',source_url:url}}};
  const news={url,bedrijf:'Canopy Solutions',titel:'Canopy Solutions heeft drie nieuwe vacatures aangekondigd',
    haak:'Canopy Solutions werft nieuwe specialisten voor een nieuw kantoor.',
    over_dit_bedrijf:true,afgewezen_reden:null,zekerheid:94,
    gepubliceerd_op:'2026-11-08T12:00:00Z',opgehaald_op:'2026-11-10T09:00:00Z'};
  const verified=sourceVerifiedComposerHandoff(action,research,news,now);
  assert.ok(verified);
  assert.equal(verified.evidence.verified_research_composer_handoff.quality_approved,false);
  assert.equal(verified.evidence.verified_research_composer_handoff.provider_send_executed,false);
  assert.equal(verified.evidence.verified_research_composer_handoff.recipient_authorized_by_handoff,false);
  assert.equal(sourceVerifiedComposerHandoff(action,research,{...news,zekerheid:30},now),null);
  assert.equal(sourceVerifiedComposerHandoff(action,research,{...news,bedrijf:'Other Company'},now),null);
  assert.equal(sourceVerifiedComposerHandoff(action,research,{...news,url:'http://example.org/unsafe'},now),null);
  assert.equal(sourceVerifiedComposerHandoff(action,{...research,person_key:'wrong'},news,now),null);
});

test('same canonical Gmail sender still gates consent, suppression, claim, dedupe and independent readback',()=>{
  for(const clause of ['verifyRecipientAuthority','powerhouse_email_contact_suppressions',
    'GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID','SENT','recipient_matches',
    "eq('status','prepared')","eq('status','waiting')",
    'needs_readback:true','republish_forbidden:true'])
    assert.ok(sender.includes(clause),'missing original sender safety gate '+clause);
  assert.doesNotMatch(sql,/GMAIL_SEND_EMAIL|update\s+powerhouse_sales_actions\s+set\s+status\s*=\s*'done'/i);
});
