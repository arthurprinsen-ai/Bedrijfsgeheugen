import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assessDailyPublicationRecovery} from '../supabase/functions/_shared/daily-publication-recovery.mjs';
import {summarizeOneLoopAssurance} from '../brain/observability/one-loop-assurance-readback.mjs';
import {projectOriginalGuardDiagnostics} from '../brain/observability/one-loop-guard-diagnostics.mjs';

const date='2026-10-31';
const decisions=[
 {channel:'linkedin_personal',decision:'publish',state:'decided',scheduled_for:'2026-10-31T07:00:00Z'},
 {channel:'linkedin_company',decision:'publish',state:'decided',scheduled_for:'2026-10-31T07:00:00Z'},
 {channel:'blog',decision:'publish',state:'decided',scheduled_for:'2026-10-31T07:00:00Z'},
 {channel:'instagram_company',decision:'hold',state:'blocked',scheduled_for:'2026-10-31T08:00:00Z',
  delivery_evidence:{capability_state:'BLOCKED_HARD_BOUNDARY',capability_reason:'EXACT_FINAL_MEDIA_PROOF_REQUIRED'}},
 {channel:'email_newsletter',decision:'hold',state:'blocked',scheduled_for:'2026-10-31T08:00:00Z',
  delivery_evidence:{capability_state:'BLOCKED_HARD_BOUNDARY',capability_reason:'NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR'}}
];
const obligations=['linkedin_personal','linkedin_company','blog','instagram']
  .map(channel=>({channel,status:'PLANNED',external_id:null}));
const proof=o=>o.status==='LIVE_PROVEN' && Boolean(o.external_id);
test('past 30-minute scheduled deadline is a recovery duty, never success',()=>{
 const before=JSON.stringify({obligations,decisions});
 const result=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T08:05:00Z',
  obligations,decisions,isTerminal:proof});
 assert.equal(result.status,'RECOVERY_DUE');
 assert.equal(result.overdue.length,5); // three late + two explicit hard boundaries
 assert.equal(result.overdue.find(x=>x.channel==='blog').code,'BLOG_APPROVAL_RELEASE_READBACK_REQUIRED');
 assert.equal(result.overdue.find(x=>x.channel==='email_newsletter').requiresAuthorization,true);
 assert.ok(result.overdue.every(x=>x.owner&&x.action));
 assert.equal(result.overdue.find(x=>x.channel==='instagram').code,'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED');
 assert.deepEqual(JSON.stringify({obligations,decisions}),before);
 assert.doesNotMatch(JSON.stringify(result),/service_role|private_token|provider_payload/i);
});
test('before a scheduled publication is due, no invented deadline violation',()=>{
 const d=decisions.filter(x=>x.channel==='linkedin_personal');
 const a=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T07:10:00Z',
  obligations:obligations.filter(x=>x.channel==='linkedin_personal'),
  decisions:d,isTerminal:proof});
 assert.equal(a.overdue.find(x=>x.channel==='linkedin_personal'),undefined);
 assert.equal(a.pending.find(x=>x.channel==='linkedin_personal').status,'AWAITING_DUE_TIME');
});
test('real external provider proof closes only that channel; historical post must never replay',()=>{
 const proven={channel:'linkedin_company',status:'LIVE_PROVEN',external_id:'urn:li:share:real'};
 const a=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T10:00:00Z',
  decisions,obligations:[proven,...obligations.filter(x=>x.channel!=='linkedin_company')],
  isTerminal:proof});
 assert.equal(a.overdue.some(x=>x.channel==='linkedin_company'),false);
 assert.ok(a.overdue.some(x=>x.channel==='linkedin_personal'));
});
test('missing scheduled decision is fail-closed, not a fabricated delivery success',()=>{
 const a=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T06:00:00Z',
  decisions:[],obligations:[],isTerminal:proof});
 assert.equal(a.status,'RECOVERY_DUE');
 assert.ok(a.overdue.every(x=>x.code==='PUBLICATION_SCHEDULE_MISSING'));
});
test('existing Brain original receipt projects safe per-channel portal alert',()=>{
 const names=['content-closed-loop','daily-compound-learning','data-spine-watchdog','full-cycle-production-proof',
 'one-brain-reconcile','revenue-flywheel','autonomous-outreach','execution-resilience','external-intelligence-universe',
 'mira-problem-loop','portal-visual-density','self-improvement-layer','seo-opportunity-resolver',
 'signal-taxonomy-self-heal','source-backed-outbound'];
 const at='2026-10-31T10:00:00Z';
 const rows=names.map((loop_key,i)=>({loop_key,status:i===0?'RED':'GREEN',
  checked_at:at,fresh_stage_count:8,required_stage_count:8,missing_stages:[],
  evidence:{guard_pass:i!==0}}));
 const assurance=summarizeOneLoopAssurance(rows,{observedAt:at});
 const recovery=assessDailyPublicationRecovery({runDate:date,now:at,obligations,decisions,isTerminal:proof});
 const receipt=[{loop_key:'content-closed-loop',stage:'guard',observed_at:at,
  evidence:{pass:false,state:{status:'BLOCKED',result:JSON.stringify({recovery})}}}];
 const p=projectOriginalGuardDiagnostics(assurance,receipt,{observedAt:at});
 const result=p.cases.find(x=>x.key==='content-closed-loop');
 assert.ok(result.reasons.some(x=>x.code==='PUBLICATION_PROOF_OVERDUE'));
 assert.equal(result.publicationRecovery.length,5);
 assert.equal(result.publicationRecovery.find(x=>x.channel==='blog').label,'Blog');
 assert.ok(result.publicationRecovery.every(x=>!('external_id' in x)&&!('provider_token' in x)));
});
test('original runtime and portal must consume one recovery classification without parallel publisher',async()=>{
 const [loop,portal,skill,agent]=await Promise.all([
  readFile(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8'),
  readFile(new URL('../.agents/skills/powerhouse-self-improvement-layer/SKILL.md',import.meta.url),'utf8'),
  readFile(new URL('../AGENTS.md',import.meta.url),'utf8')
 ]);
 assert.match(loop,/assessDailyPublicationRecovery/);
 assert.match(loop,/recovery\.overdue\.length > 0/);
 assert.doesNotMatch(loop,/const TERMINAL_GREEN = new Set\(\[[^\]]*SKIPPED/);
 assert.match(loop,/recovery,\s*obligations: obligationSummary/);
 assert.match(portal,/data-publication-recovery="RECOVERY_DUE"/);
 assert.match(skill,/PUBLICATION_NO_SILENT_GAP_V1/);
 assert.match(agent,/PUBLICATION_NO_SILENT_GAP_V1/);
});


// Production regression: npm:postgres parses timestamptz into a native Date.
// The first live 31 October run classified every original scheduled decision
// as PUBLICATION_SCHEDULE_MISSING even though SQL contained real timestamps.
test('real Postgres Date object preserves publication deadline and root cause',()=>{
 const withDriverDates=decisions.map(d=>({...d,scheduled_for:new Date(d.scheduled_for)}));
 const result=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T08:45:00Z',
  obligations,decisions:withDriverDates,isTerminal:proof});
 assert.equal(result.status,'RECOVERY_DUE');
 assert.equal(result.overdue.length,5);
 assert.ok(result.overdue.every(x=>x.code!=='PUBLICATION_SCHEDULE_MISSING'));
 assert.equal(result.overdue.find(x=>x.channel==='linkedin_personal').scheduledFor,'2026-10-31T07:00:00.000Z');
 assert.equal(result.overdue.find(x=>x.channel==='blog').code,'BLOG_APPROVAL_RELEASE_READBACK_REQUIRED');
 assert.equal(result.overdue.find(x=>x.channel==='instagram').code,'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED');
 assert.equal(result.overdue.find(x=>x.channel==='email_newsletter').code,'EMAIL_CANONICAL_AUTHORIZATION_REQUIRED');
 // A valid future date must not be marked overdue before its due/grace time.
 const fresh=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T07:05:00Z',
  obligations:[obligations.find(x=>x.channel==='blog')],
  decisions:[withDriverDates.find(x=>x.channel==='blog')],isTerminal:proof});
 assert.equal(fresh.pending.some(x=>x.channel==='blog'),true);
 const invalid=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T08:45:00Z',
  obligations,decisions:withDriverDates.map(x=>({...x,scheduled_for:new Date('invalid')})),
  isTerminal:proof});
 assert.ok(invalid.overdue.every(x=>x.code==='PUBLICATION_SCHEDULE_MISSING'));
});


test('approved provider 429 insufficient_quota is safe human-action reason, never retry/sending proof',()=>{
 const quota='429 insufficient_quota:do-not-leak-PROVIDER_SECRET';
 const billed=decisions.map(d=>['blog','linkedin_personal','linkedin_company'].includes(d.channel)?
  {...d,scheduled_for:new Date(d.scheduled_for),delivery_evidence:{
   artifact_generation_failure:{classification:'PROVIDER_BILLING',reason:quota,
    retry_after:'2026-10-31T09:44:10Z',provider_side_effect:false}}}:
  {...d,scheduled_for:new Date(d.scheduled_for)});
 const output=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T08:51:00Z',
  obligations,decisions:billed,isTerminal:proof});
 const content=output.overdue.filter(x=>['blog','linkedin_personal','linkedin_company'].includes(x.channel));
 assert.equal(content.length,3);
 assert.ok(content.every(x=>x.code==='CONTENT_GENERATION_BILLING_ACTION_REQUIRED'));
 assert.ok(content.every(x=>x.requiresAuthorization===true));
 assert.ok(content.every(x=>x.scheduledFor==='2026-10-31T07:00:00.000Z'));
 assert.equal(output.overdue.find(x=>x.channel==='instagram').code,'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED');
 assert.equal(output.overdue.find(x=>x.channel==='email_newsletter').code,'EMAIL_CANONICAL_AUTHORIZATION_REQUIRED');
 assert.doesNotMatch(JSON.stringify(output),/do-not-leak-PROVIDER_SECRET|insufficient_quota/i);
 const names=['content-closed-loop','daily-compound-learning','data-spine-watchdog','full-cycle-production-proof',
 'one-brain-reconcile','revenue-flywheel','autonomous-outreach','execution-resilience','external-intelligence-universe',
 'mira-problem-loop','portal-visual-density','self-improvement-layer','seo-opportunity-resolver',
 'signal-taxonomy-self-heal','source-backed-outbound'];
 const at='2026-10-31T08:51:00Z';
 const assurance=summarizeOneLoopAssurance(names.map((loop_key,i)=>({
  loop_key,status:i===0?'RED':'GREEN',checked_at:at,fresh_stage_count:8,required_stage_count:8,
  missing_stages:[],evidence:{guard_pass:i!==0}})),{observedAt:at});
 const projected=projectOriginalGuardDiagnostics(assurance,[{loop_key:'content-closed-loop',
  stage:'guard',observed_at:at,evidence:{pass:false,state:{status:'BLOCKED',
   result:JSON.stringify({recovery:output})}}}],{observedAt:at});
 const caseInfo=projected.cases.find(x=>x.key==='content-closed-loop');
 assert.ok(caseInfo.reasons.some(x=>x.code==='CONTENT_GENERATION_BILLING_ACTION_REQUIRED'));
 assert.equal(caseInfo.publicationRecovery.find(x=>x.channel==='linkedin_personal').code,
  'CONTENT_GENERATION_BILLING_ACTION_REQUIRED');
 assert.doesNotMatch(JSON.stringify(projected),/do-not-leak-PROVIDER_SECRET/);
});


test('Mira requires genuinely new immutable daily source winner before generating media',()=>{
 const deadline=new Date('2026-10-31T08:00:00Z');
 const old={...decisions.find(x=>x.channel==='instagram_company'),scheduled_for:deadline};
 const overdue=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T09:04:00Z',
  decisions:[old],obligations:obligations.filter(x=>x.channel==='instagram'),isTerminal:proof});
 const todo=overdue.overdue.find(x=>x.channel==='instagram');
 assert.equal(todo.code,'MIRA_UNIQUE_SOURCE_WINNER_REQUIRED');
 assert.equal(todo.scheduledFor,deadline.toISOString());
 assert.equal(todo.requiresAuthorization,false);
 assert.match(todo.action,/bronagent/);
 const winner={...old,delivery_evidence:{...old.delivery_evidence,
  daily_winner_recommendation_id:'new-eligible-immutable-winner'}};
 const media=assessDailyPublicationRecovery({runDate:date,now:'2026-10-31T09:04:00Z',
  decisions:[winner],obligations:obligations.filter(x=>x.channel==='instagram'),isTerminal:proof});
 assert.equal(media.overdue.find(x=>x.channel==='instagram').code,'MIRA_FINAL_MEDIA_PROOF_REQUIRED');
 assert.equal(media.overdue.find(x=>x.channel==='instagram').requiresAuthorization,true);
 assert.equal(obligations.find(x=>x.channel==='instagram').external_id,null);
});
