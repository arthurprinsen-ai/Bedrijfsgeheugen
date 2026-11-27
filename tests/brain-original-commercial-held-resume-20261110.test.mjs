import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {sourceVerifiedComposerHandoff} from '../supabase/functions/_shared/verified-research-composer-handoff.mjs';

const composer=readFileSync(new URL('../supabase/functions/powerhouse-commercial-message-composer/index.ts',import.meta.url),'utf8');
const sender=readFileSync(new URL('../supabase/functions/powerhouse-autonomous-outreach/index.ts',import.meta.url),'utf8');

test('only original composer reselects verified research-held waiting action from canonical plan view',()=>{
  assert.match(composer,/async function originalVerifiedSourceHeldCandidates/);
  assert.match(composer,/from\('powerhouse_commercial_message_plan_v1'\)\.select\('\*'\)/);
  assert.match(composer,/\.eq\('status','waiting'\)/);
  assert.match(composer,/\.contains\('evidence',\{execution_gate:\{reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'\}\}\)/);
  assert.match(composer,/\.eq\('dedupe_key','relationship-research:outreach-source:'\+action\.action_id\)/);
  assert.match(composer,/\.eq\('action_type','research_enrichment'\)\.eq\('channel','internal'\)/);
  assert.match(composer,/\.eq\('person_key',action\.person_key\)\.eq\('company_key',action\.company_key\)/);
  assert.match(composer,/\.eq\('status','done'\)\.maybeSingle\(\)/);
  assert.match(composer,/\.from\('bg_bedrijfsnieuws'\)/);
  assert.match(composer,/\.eq\('url',sourceUrl\)\.eq\('over_dit_bedrijf',true\)/);
  assert.match(composer,/const verified=sourceVerifiedComposerHandoff\(action,research,news,now\)/);
  assert.match(composer,/if\(verified\)resumed\.push\(verified\)/);
  assert.match(composer,/const sourceHeld=await originalVerifiedSourceHeldCandidates\(db,limit,channels,actionIds,now\)/);
  assert.match(composer,/const known=new Set\(sourceHeld\.map/);
  assert.match(composer,/rows=\[\.\.\.sourceHeld,\.\.\.rows\.filter/);
  assert.match(composer,/\.slice\(0,limit\)/);
  assert.match(composer,/a\.status==='waiting' && a\.evidence\?\.verified_research_composer_handoff\?\.contract/);
});

test('existing composer independently gates quality before returning held originals to original sender',()=>{
  assert.match(composer,/const sourceGate=composerSourcePreflight\(workingAction,workingAction\.message_plan\)/);
  assert.match(composer,/qv\.checks\.source_specific_evidence_ok===true/);
  assert.match(composer,/qv\.checks\.semantic_novelty_ok===true/);
  assert.match(composer,/update\.status='prepared';update\.due_at=now/);
  assert.match(composer,/reason:'SOURCE_VERIFIED_COMPOSER_ACCEPTED'/);
  assert.match(composer,/provider_attempted:false,provider_readback_verified:false/);
});

test('verified canonical company news is necessary and never recipient or provider authorization',()=>{
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
  assert.equal(sourceVerifiedComposerHandoff(action,{...research,evidence:{...research.evidence,original_outreach_action_id:'wrong'}},news,now),null);
});

test('only original canonical Gmail sender retains recipient authority, opt-out, provider evidence and no-resend',()=>{
  for(const clause of ['verifyRecipientAuthority','powerhouse_email_contact_suppressions',
    'GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID','recipient_matches',
    "eq('status','prepared')","eq('status','waiting')",
    'needs_readback:true','republish_forbidden:true'])
    assert.ok(sender.includes(clause),'missing original sender safety gate '+clause);
  assert.doesNotMatch(composer,/GMAIL_SEND_EMAIL|GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID/);
});

test('no standalone SQL preview migration, second executor or schedule is introduced',()=>{
  assert.equal(existsSync(new URL('../supabase/migrations/20261110140500_original_commercial_verified_research_resume_v1.sql',import.meta.url)),false);
  const helper=composer.slice(composer.indexOf('async function originalVerifiedSourceHeldCandidates'),composer.indexOf('Deno.serve'));
  assert.doesNotMatch(helper,/net\.http_post|cron\.schedule|GMAIL_SEND_EMAIL|\.update\(|\.insert\(|\.upsert\(/);
});
