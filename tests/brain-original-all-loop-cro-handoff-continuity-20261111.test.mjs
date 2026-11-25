import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_AGENT_TEAM} from '../platform/agents/agent-team.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const fp='powerhouse|all-loops|one-owner-receipt-cro-autonomous-decision-continuity|20261111-v1';

test('same 14 original agents own all independent handoffs, safe CRO and verified learning',()=>{
 assert.equal(DEFAULT_AGENT_TEAM.length,14);
 assert.equal(new Set(DEFAULT_AGENT_TEAM.map(a=>a.id)).size,14);
 const has=(id,task)=>{
  const a=DEFAULT_AGENT_TEAM.find(a=>a.id===id);
  assert.ok(a && a.tasks.includes(task),id+':'+task);
 };
 const expectations=[
  ['agent-reliability','audit-all-active-original-loop-handoffs-without-aging-out'],
  ['agent-reliability','reconcile-unchanged-consumer-ack-under-original-owner-lease'],
  ['agent-reliability','require-independent-receipt-before-terminal-green'],
  ['agent-data-quality','verify-exact-tenant-source-revision-consumer-ack'],
  ['agent-data-quality','detect-provenance-or-source-freshness-gap-before-cro-action'],
  ['agent-website-ux','show-open-original-owner-stage-and-next-action-tenant-safely'],
  ['agent-growth-market','autonomously-rank-one-eligible-safe-reversible-cro-action'],
  ['agent-growth-market','reject-unqualified-cro-variant-with-source-evidence-and-owner'],
  ['agent-growth-market','confirm-next-natural-run-applied-proven-learning'],
  ['agent-seo-content','route-evidence-backed-technical-seo-cro-fix-to-original-lease'],
  ['agent-social-delivery-recovery','reconcile-overdue-original-provider-to-metric-to-learning-acks-without-republish']
 ];
 for(const [id,task] of expectations)has(id,task);
 const source=read('platform/agents/agent-team.mjs');
 assert.doesNotMatch(source,/cron\.schedule|setInterval\(|new Scheduler\(|provider\.post\(/);
});

test('both current original skills demand one source/owner/receipt chain and protected safe CRO decision',()=>{
 const continuity=read('.agents/skills/powerhouse-continuity/SKILL.md');
 const conversion=read('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md');
 for(const s of [continuity,conversion]){
   assert.ok(s.includes(fp));
   for(const t of ['sourceRevision','Heartbeat','ONE BRAIN','holdout','REVIEW_REQUIRED','EVIDENCE_DUE','original','CodeQL']){
    assert.ok(s.toLowerCase().includes(t.toLowerCase()),t);
   }
   assert.match(s,/no second scheduler|geen tweede scheduler/i);
   assert.match(s,/NO_SAFE_CHANGE_WITH_EVIDENCE/);
   assert.match(s,/powerhouse_autonomous_experiment_readiness_v1/);
   assert.match(s,/powerhouse_optimization_candidate_v1/);
 }
 for(const t of ['20261111093500','20261111094222','826','RESULT_UNKNOWN','powerhouse_loop_assurance_state_v1']){
  assert.ok(continuity.includes(t),t);
 }
});

test('exact native provider 826 source identities without replay or loss of historical prefix',()=>{
 const lock=JSON.parse(read('supabase/migration-history.lock.json'));
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=826,'later provider migrations are allowed only as append-only extensions');
 const pairs=lock.applied.map(r=>r.version+'|'+r.name);
 assert.equal(new Set(pairs).size,lock.applied.length);
 assert.equal(new Set(lock.applied.map(r=>r.version)).size,lock.applied.length);
 assert.deepEqual(lock.applied.slice(0,826).slice(-2),[
  {version:'20261111093500',name:'original_loop_assurance_fault_isolation_v1'},
  {version:'20261111094222',name:'original_loop_assurance_fault_isolation_v1'}
 ]);
 const first=read('supabase/migrations/20261111093500_original_loop_assurance_fault_isolation_v1.sql');
 const second=read('supabase/migrations/20261111094222_original_loop_assurance_fault_isolation_v1.sql');
 assert.equal(first,second);
 assert.match(first,/v_receipt_sync_failure_sqlstate/);
 assert.match(first,/v_content_handoff_failure_sqlstate/);
 assert.doesNotMatch(first,/cron\.schedule|net\.http_post|delete\s+from\s+supabase_migrations/i);
});

test('durable ONE BRAIN lesson and human ledger preserve original open delivery truth',()=>{
 const item=JSON.parse(read('brain/learning/2026-11-11-original-all-loop-cro-handoff-continuity-v1.json'));
 assert.equal(item.fingerprint,fp);
 assert.equal(item.original_owner,'Original Powerhouse / ONE BRAIN / Heartbeat 15-loop assurance');
 assert.equal(item.live_evidence.original_active_loops,15);
 assert.equal(item.live_evidence.green,8);
 assert.equal(item.live_evidence.red,7);
 assert.equal(item.live_evidence.content_handoff_open,433);
 assert.equal(item.live_evidence.content_handoff_overdue,403);
 assert.equal(item.live_evidence.historical_result_unknown_escalated,2);
 assert.equal(item.live_evidence.cro_assignments,0);
 assert.equal(item.no_new_scheduler,true);
 assert.equal(item.no_provider_replay,true);
 assert.equal(item.customer_end_to_end_proven,false);
 const docs=[read('docs/changes/2026-11-11-original-all-loop-autonomous-cro-handoff.md'),
  read('docs/development-ledger-events/2026-11-11-original-all-loop-autonomous-cro-handoff.md')];
 for(const doc of docs){
  assert.ok(doc.includes(fp));
  assert.ok(doc.includes('#4198') && doc.includes('#4215'));
  assert.ok(doc.includes('EVIDENCE_DUE'));
 }
});
