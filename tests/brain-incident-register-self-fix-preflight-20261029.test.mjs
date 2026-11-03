import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compileChatLearningPreflight, evaluateIncidentSelfFix } from '../scripts/brain/chat-learning-preflight.mjs';
import { reconcileIncidentObligations } from '../brain/observability/incident-obligation-assurance.mjs';

const POLICY_PATH = 'brain/policies/powerhouse-incident-register-and-self-fix-v1.json';
const policy = () => JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
const MARKER = policy().skill_protocol.marker;

function fixtureRoot(skills) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'incident-selffix-'));
  for (const [name, body] of Object.entries(skills)) {
    fs.mkdirSync(path.join(root, '.agents/skills', name), { recursive: true });
    fs.writeFileSync(path.join(root, '.agents/skills', name, 'SKILL.md'), body);
  }
  fs.mkdirSync(path.join(root, 'brain/observability'), { recursive:true });
  fs.writeFileSync(path.join(root, 'brain/observability/incident-obligation-assurance.mjs'), '// fixture auditor');
  return root;
}

test('real repository: preflight is READY and exposes the incident protocol and visible loop debt', () => {
  const packet = compileChatLearningPreflight();
  assert.equal(packet.status, 'READY');
  const info = packet.incident_self_fix;
  assert.equal(info.fingerprint, 'agents-skills-register-and-self-fix-v1');
  assert.equal(info.failClosed, true);
  assert.ok(info.skills_with_protocol >= 1, 'the canonical continuity skill must carry the marker');
  assert.equal(info.skills_with_protocol + info.loop_debt.count, info.skills_total);
  assert.ok(packet.sources.some(source => source.path === POLICY_PATH), 'policy must be a mandatory preflight source');
});

test('a new skill without the marker fails the preflight', () => {
  const root = fixtureRoot({ 'nieuwe-skill': '# Nieuwe skill\nGeen protocol.\n' });
  assert.throws(() => evaluateIncidentSelfFix({ rootDir: root, policy: policy() }), /INCIDENT_PROTOCOL_MISSING_ON_NEW_SKILL:nieuwe-skill/);
});

test('a new skill with the marker passes', () => {
  const root = fixtureRoot({ 'nieuwe-skill': `# Nieuwe skill\n${MARKER}\n` });
  const result = evaluateIncidentSelfFix({ rootDir: root, policy: policy() });
  assert.equal(result.skills_with_protocol, 1);
  assert.equal(result.loop_debt.count, 0);
});

test('a baseline skill without the marker is visible loop debt, not a failure', () => {
  const p = policy();
  const baselineSkill = p.loop_debt_baseline[0];
  const root = fixtureRoot({ [baselineSkill]: '# Oude skill\n' });
  const result = evaluateIncidentSelfFix({ rootDir: root, policy: p });
  assert.deepEqual(result.loop_debt.skills, [baselineSkill]);
  assert.equal(result.skills_with_protocol, 0);
});

test('policy drift fails closed', () => {
  const root = fixtureRoot({});
  for (const mutate of [
    p => { p.status = 'DRAFT'; },
    p => { p.fail_closed = false; },
    p => { p.fingerprint = 'something-else'; },
    p => { p.skill_protocol.new_skills_must_carry_marker = false; },
    p => { p.reserved_for_owner = []; },
    p => { delete p.loop_debt_baseline; }
  ]) {
    const p = policy();
    mutate(p);
    assert.throws(() => evaluateIncidentSelfFix({ rootDir: root, policy: p }));
  }
});

test('owner-reserved decisions stay reserved', () => {
  const p = policy();
  for (const item of ['PROTECTED_MERGE', 'PRODUCTION_MIGRATIONS', 'SPEND_AND_CREDITS', 'IRREVERSIBLE_OR_COSTLY_DECISIONS', 'ANYTHING_SENT_TO_THIRD_PARTIES']) {
    assert.ok(p.reserved_for_owner.includes(item), item);
  }
  assert.match(p.on_reserved_boundary, /ONE_DEDUPED_OBLIGATION/);
});

test('baseline contains no skill that already carries the marker (debt shrinks, never hides)', () => {
  const p = policy();
  for (const name of p.loop_debt_baseline) {
    const file = path.join('.agents/skills', name, 'SKILL.md');
    assert.ok(fs.existsSync(file), `baseline names a missing skill: ${name}`);
    assert.ok(!fs.readFileSync(file, 'utf8').includes(MARKER), `${name} has the marker; remove it from loop_debt_baseline`);
  }
});


test('every agent preflight requires one closed Lean loop with evidence and data-gap recovery', () => {
  const root = fixtureRoot({});
  const info = evaluateIncidentSelfFix({ rootDir: root, policy: policy() });
  assert.equal(info.lean_loop.required, true);
  assert.deepEqual(info.lean_loop.stages, ['MEASURE','ANALYZE','HYPOTHESIZE','PRIORITIZE','IMPLEMENT','VERIFY','LEARN','REMEASURE']);
  assert.ok(info.lean_loop.evidence_fields.includes('after_metric'));
  assert.match(info.lean_loop.data_gap_rule, /UNKNOWN is not ZERO/);
});

test('a second authority, missing proof or empty instrumentation contract fails closed', () => {
  const root = fixtureRoot({});
  const alterations = [
    p => { delete p.continuous_lean_loop; },
    p => { p.continuous_lean_loop.stages = ['MEASURE','LEARN']; },
    p => { p.continuous_lean_loop.one_authority_only = false; },
    p => { p.continuous_lean_loop.one_existing_heartbeat_cadence_only = false; },
    p => { delete p.continuous_lean_loop.canonical_tables.incident; },
    p => { p.continuous_lean_loop.required_material_action_evidence = []; },
    p => { p.continuous_lean_loop.hard_gates = []; },
    p => { p.continuous_lean_loop.data_gap_rule = 'ignore missing data'; }
  ];
  for (const change of alterations) {
    const p = policy(); change(p);
    assert.throws(() => evaluateIncidentSelfFix({ rootDir: root, policy: p }));
  }
});

test('agent instructions link the existing enforceable Lean loop rather than a parallel system', () => {
  const agents = fs.readFileSync('AGENTS.md','utf8');
  assert.match(agents, /ONE BRAIN Lean\/PDCA observability/);
  assert.match(agents, /powerhouse-incident-register-and-self-fix-v1.json/);
  assert.match(agents, /MEASURE → ANALYZE → HYPOTHESIZE → PRIORITIZE → IMPLEMENT → VERIFY → LEARN → REMEASURE/);
});


const fingerprint='github|runtime|known-failure|v1';
const observed={
  provider_event_id:'github:run:41546047078:job:archive',
  fingerprint, observed_at:'2026-11-03T06:00:00Z',
  payload_sha256:'a'.repeat(64)
};
const receipt={
  provider_event_id:observed.provider_event_id, fingerprint,
  payload_sha256:observed.payload_sha256,
  registered_at:'2026-11-03T06:00:01Z',
  readback_confirmed:true
};
const recovery={
  provider_event_id:observed.provider_event_id, fingerprint,
  owner:'original-delivery-owner',obligation_id:'original-incident-obligation',
  fix_attempted:true,status:'VERIFIED',verified_at:'2026-11-03T06:05:00Z',
  regression_passed:true,independent_provider_readback:true,prevention_applied:true,
  skill_version:'skill-v2',release_sha:'b'.repeat(40)
};
const auditable=extra=>({
  observations:[observed],receipts:[receipt],recoveries:[recovery],
  sourceReadbackComplete:true,registryReadbackComplete:true,...extra
});

test('a provider failure without a canonical Brain receipt becomes its own open incident',()=>{
  const x=reconcileIncidentObligations(auditable({receipts:[]}));
  assert.equal(x.status,'UNREPORTED_FAILURE_DETECTED');
  assert.equal(x.missing_reports,1);
  assert.equal(x.proven_recovered,0);
  assert.equal(x.global_green,false);
  assert.equal(x.obligations[0].next_action,'EXISTING_ONE_BRAIN_OWNER_ATOMIC_OBSERVE_AND_READBACK');
});

test('observed error must be safely recovered, not merely logged',()=>{
  const x=reconcileIncidentObligations(auditable({recoveries:[]}));
  assert.equal(x.status,'SAFE_RECOVERY_REQUIRED');
  assert.equal(x.recovery_required,1);
  const reserved=reconcileIncidentObligations(auditable({recoveries:[{
    provider_event_id:observed.provider_event_id,fingerprint,authorization_required:true
  }]}));
  assert.equal(reserved.obligations[0].next_action,'EXISTING_OWNER_ESCALATE_PERMISSION_BOUNDARY');
});

test('false repair success without provider readback, skill and regression never closes',()=>{
  for (const bad of [
    {independent_provider_readback:false},
    {regression_passed:false},
    {prevention_applied:false},
    {release_sha:null},
    {skill_version:null}
  ]) {
    const x=reconcileIncidentObligations(auditable({recoveries:[{...recovery,...bad}]}));
    assert.equal(x.status,'RECOVERY_NOT_PROVEN');
    assert.equal(x.proven_recovered,0);
  }
});

test('repeat after verified fix reopens same fingerprint without fabricating a new cause',()=>{
  const recurrence={...observed,provider_event_id:'github:run:41546047079:job:archive',observed_at:'2026-11-03T07:00:00Z'};
  const x=reconcileIncidentObligations(auditable({observations:[observed,recurrence],
    receipts:[receipt,{...receipt,provider_event_id:recurrence.provider_event_id,registered_at:'2026-11-03T07:00:01Z'}]}));
  assert.equal(x.recurring_failures,1);
  assert.equal(x.global_green,false);
  assert.ok(x.obligations.some(e=>e.status==='REGRESSION_RECURRED_AFTER_VERIFICATION'));
});

test('provider duplicates dedupe but contradictory hashes fail closed',()=>{
  const d=reconcileIncidentObligations(auditable({observations:[observed,{...observed}]}));
  assert.equal(d.registered,1);
  assert.equal(d.proven_recovered,1);
  const conflict=reconcileIncidentObligations(auditable({observations:[observed,{...observed,payload_sha256:'c'.repeat(64)}]}));
  assert.equal(conflict.status,'INCIDENT_IDENTITY_CONFLICT');
  assert.equal(conflict.provider_conflicts,1);
});

test('incomplete source audit and malformed provider events can never become green',()=>{
  const missing=reconcileIncidentObligations(auditable({sourceReadbackComplete:false}));
  assert.equal(missing.status,'SOURCE_COVERAGE_UNVERIFIED');
  assert.equal(missing.global_green,false);
  const absent=reconcileIncidentObligations({observations:[],receipts:[],recoveries:[]});
  assert.equal(absent.status,'SOURCE_COVERAGE_UNVERIFIED');
  const invalid=reconcileIncidentObligations(auditable({observations:[{...observed,provider_event_id:'bad value'}]}));
  assert.equal(invalid.status,'INCIDENT_IDENTITY_CONFLICT');
});

test('mandatory agent preflight surfaces reporting audit without claiming global coverage',()=>{
  const packet=compileChatLearningPreflight();
  assert.equal(packet.incident_self_fix.incident_reporting_audit.required,true);
  assert.equal(packet.incident_self_fix.reporting_audit.status,'SOURCE_COVERAGE_UNVERIFIED');
  const explicit=compileChatLearningPreflight({executionContext:{incidentEvidence:auditable({receipts:[]})}});
  assert.equal(explicit.incident_self_fix.reporting_audit.status,'UNREPORTED_FAILURE_DETECTED');
});

test('policy cannot silently disable reporting receipt, independent proof or single ownership',()=>{
  const root=fixtureRoot({});
  for(const tamper of [
    p=>{delete p.incident_reporting_audit;},
    p=>{p.incident_reporting_audit.required=false;},
    p=>{p.incident_reporting_audit.entrypoint='other/observer.mjs';},
    p=>{p.incident_reporting_audit.rules=[];}
  ]){
    const p=policy();tamper(p);
    assert.throws(()=>evaluateIncidentSelfFix({rootDir:root,policy:p}),/INCIDENT_REPORTING_ASSURANCE_POLICY_DRIFT/);
  }
});

test('provider event IDs cannot be assigned multiple competing incident fingerprints',()=>{
  const second={...observed,fingerprint:'github|runtime|different-incident|v1'};
  const x=reconcileIncidentObligations(auditable({
    observations:[observed,second],
    receipts:[receipt,{...receipt,fingerprint:second.fingerprint}],
    recoveries:[recovery,{...recovery,fingerprint:second.fingerprint}]
  }));
  assert.equal(x.status,'INCIDENT_IDENTITY_CONFLICT');
  assert.equal(x.provider_conflicts,1);
  assert.equal(x.registered,0);
  assert.equal(x.proven_recovered,0);
  assert.ok(x.obligations.some(e=>e.status==='PROVIDER_EVENT_FINGERPRINT_CONFLICT'));
  assert.equal(x.global_green,false);
});

test('multiple candidate recovery receipts never silently choose a favorable proof',()=>{
  const x=reconcileIncidentObligations(auditable({
    recoveries:[recovery,{...recovery,status:'FAILED',regression_passed:false}]
  }));
  assert.equal(x.status,'INCIDENT_IDENTITY_CONFLICT');
  assert.equal(x.provider_conflicts,1);
  assert.equal(x.proven_recovered,0);
  assert.ok(x.obligations.some(e=>e.status==='RECOVERY_RECEIPT_CONFLICT'));
  assert.equal(x.global_green,false);
});

test('identity conflict must outrank an otherwise complete source scan',()=>{
  const conflict=reconcileIncidentObligations(auditable({
    observations:[observed,{...observed,fingerprint:'github|runtime|other|v2'}],
    sourceReadbackComplete:true,
    registryReadbackComplete:true
  }));
  assert.equal(conflict.status,'INCIDENT_IDENTITY_CONFLICT');
  assert.equal(conflict.global_green,false);
});


test('original agent preflight keeps failure backlog fail closed and does not expose raw fingerprints',()=>{
  const absent=compileChatLearningPreflight();
  assert.equal(absent.incident_self_fix.failure_backlog_audit.status,'SOURCE_COVERAGE_UNVERIFIED');
  assert.equal(absent.incident_self_fix.failure_backlog_audit.global_green,false);
  const included=compileChatLearningPreflight({executionContext:{failureRegistryEvidence:{
    rows:[{fingerprint:'internal|customer-sensitive|event',maturity:'OBSERVED',root_cause:null,
      prevention_rule:null,regression_ref:null,occurrence_count:5,last_seen_at:'2026-11-03T10:00:00Z'}],
    expectedTotal:1,readbackComplete:true,observedAt:'2026-11-03T11:00:00Z'
  }}});
  const backlog=included.incident_self_fix.failure_backlog_audit;
  assert.equal(backlog.status,'RECOVERY_TRIAGE_DUE');
  assert.equal(backlog.totals.missing_cause,1);
  assert.equal(backlog.actionable_count,1);
  assert.equal(backlog.global_green,false);
  assert.equal('obligations' in backlog,false);
  assert.doesNotMatch(JSON.stringify(backlog),/customer-sensitive/);
});
