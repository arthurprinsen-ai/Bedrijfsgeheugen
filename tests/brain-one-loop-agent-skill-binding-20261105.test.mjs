import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_AGENT_TEAM} from '../platform/agents/agent-team.mjs';

const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const root='powerhouse|brain-portal-heartbeat|generic-assurance-owner-rewrite-blocks-specialist-repair|20261105-v1';
const changedSkillPaths=[
 '.agents/skills/powerhouse-self-improvement-layer/SKILL.md',
 '.agents/skills/powerhouse-company-intelligence-os/SKILL.md',
 '.agents/skills/portal-living-interface/SKILL.md',
 '.agents/skills/powerhouse-delivery-concurrency/SKILL.md'
];

test('the original Agent Fabric retains precisely the same 14 registered specialists and no new runtime authority',()=>{
 const ids=DEFAULT_AGENT_TEAM.map(x=>x.id);
 assert.equal(ids.length,14);
 assert.equal(new Set(ids).size,14);
 for(const id of ['agent-reliability','agent-data-quality','agent-website-ux',
   'agent-growth-market','agent-social-delivery-recovery','agent-security'])
  assert.ok(ids.includes(id),id);
 assert.equal(ids.filter(x=>x==='agent-social-delivery-recovery').length,1);
 const source=await read('platform/agents/agent-team.mjs');
 assert.doesNotMatch(source,/cron\.schedule|setInterval\(|new Scheduler\(|createPublisher\(|provider\.post\(/);
});

test('existing reliability, data, Portal, growth and social agents use canonical original owner and real outcomes',()=>{
 const byId=id=>DEFAULT_AGENT_TEAM.find(x=>x.id===id);
 const task=(id,value)=>assert.ok(byId(id).tasks.includes(value),id+':'+value);
 task('agent-reliability','read-canonical-15-loop-owner-and-action');
 task('agent-reliability','reconcile-existing-brain-obligation-with-runtime-proof');
 task('agent-reliability','reopen-source-fingerprint-on-regression');
 task('agent-data-quality','validate-exact-assurance-owner-action-source-pair');
 task('agent-data-quality','verify-fresh-original-stage-and-provider-receipts');
 task('agent-website-ux','verify-one-primary-portal-recovery-action-from-original-brain');
 task('agent-website-ux','verify-admin-and-tenant-protected-owner-readback');
 task('agent-growth-market','distinguish-source-green-from-executed-commercial-outcome');
 task('agent-growth-market','learn-from-provider-verified-conversion-or-honest-no-evidence');
 task('agent-social-delivery-recovery','consume-original-content-closed-loop-owner-action');
 task('agent-social-delivery-recovery','verify-exact-channel-provider-id-before-resolution');
 assert.ok(byId('agent-reliability').playbooks.includes('no-green-from-owner-assignment'));
});

test('universal agents and existing skills require original one-owner routing and honest action proof',async()=>{
 const global=await read('AGENTS.md');
 assert.match(global,/CANONICAL AGENT CONTRACT: Heartbeat/);
 for(const k of ['powerhouse_loop_assurance_registry_v1','brain_obligations',
  'powerhouse_loop_assurance_state_v1','powerhouse_loop_assurance_receipts_v1',
  'HANDOFF_SOURCE_CONFLICT','brain_observe_failure','EVIDENCE_DUE',
  'protected tests','original next natural run']){
   assert.ok(global.toLowerCase().includes(k.toLowerCase()),'missing universal contract '+k);
 }
 for(const path of changedSkillPaths){
  const source=await read(path);
  assert.ok(source.startsWith('---\n'),path+' requires valid YAML frontmatter');
  assert.match(source,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
  assert.match(source,/2026-11-05/);
  assert.match(source,/#4198|PR #5441|\/#4198/);
  assert.match(source,/ONE BRAIN|original/i);
  assert.doesNotMatch(source,/\bcreate another publisher\b|\bdisable production guard\b/i);
 }
 const agentSkill=await read(changedSkillPaths[0]);
 assert.match(agentSkill,/15\/15/);
 assert.match(agentSkill,/8 GREEN \/ 3 AMBER \/ 4 RED/);
 assert.match(agentSkill,/geen fictieve meting|geen synthetisch groen/);
});

test('original production owner/action database authority remains the unique source, no SQL/cron added by this governance change',async()=>{
 const sql=await read('supabase/migrations/20261105111500_original_15_loop_owner_coordination.sql');
 const portal=await read('brain/observability/one-loop-assurance-readback.mjs');
 assert.match(sql,/r\.evidence_contract->>'recovery_owner'/);
 assert.match(sql,/r\.evidence_contract->>'recovery_action'/);
 assert.match(sql,/owner=excluded\.owner/);
 assert.match(sql,/recovery_owner_registered/);
 assert.match(portal,/recoveryOwner:routeOwner,recoveryAction:routeAction/);
 assert.doesNotMatch(sql,/cron\.schedule|create\s+table|create\s+publisher/i);
 assert.equal((sql.match(/'social-publisher','powerhouse-content-loop'/g)||[]).length,1);
});

test('source-backed skill learning retains original incident, 15/15 routes and explicitly unverified business execution',async()=>{
 const record=JSON.parse(await read('brain/learning/2026-11-05-verified-original-agent-skill-heartbeat-handoff-v1.json'));
 const predecessor=JSON.parse(await read('brain/learning/2026-11-05-brain-portal-heartbeat-owner-handoff-v1.json'));
 assert.equal(predecessor.fingerprint,root);
 assert.equal(record.related_original_incident,root);
 assert.equal(record.canonical_incident,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198');
 assert.equal(record.source_evidence.original_owner_matches,15);
 assert.equal(record.source_evidence.original_action_matches,15);
 assert.equal(record.source_evidence.actual_loop_status.GREEN,8);
 assert.equal(record.source_evidence.actual_loop_status.AMBER,3);
 assert.equal(record.source_evidence.actual_loop_status.RED,4);
 assert.equal(record.source_evidence.active_blocker_records,23);
 assert.equal(record.source_evidence.original_specialist_actions_executed,false);
 assert.equal(record.source_evidence.paid_or_customer_outcome_proven,false);
 assert.equal(record.compiler.machine_enforceable,true);
 assert.equal(record.canonical_brain_registration.maturity,'VALIDATED');
 assert.equal(record.canonical_brain_registration.occurrence_count,1);
 assert.equal(record.canonical_brain_registration.version,2);
 assert.equal(record.canonical_brain_registration.proven_fix,null);
 assert.equal(record.canonical_brain_registration.regression_ref,'tests/brain-one-loop-agent-skill-binding-20261105.test.mjs');
 assert.match(record.terminal_rule,/EVIDENCE_DUE/);
 const ledger=await read('docs/development-ledger-events/2026-11-05-original-agent-skill-15-loop-source-proof.md');
 assert.match(ledger,/12:15:43 UTC/);
 assert.match(ledger,/Netlify READY exact commit/);
 assert.match(ledger,/23 actieve|23 active/);
 const change=await read('docs/changes/2026-11-05-verified-heartbeat-agent-skills-handoff.md');
 assert.match(change,/geen (extra|tweede) agent|bestaande Agent Fabric/i);
 assert.match(change,/HANDOFF_SOURCE_CONFLICT/);
});
