import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(path,'utf8');
const globalRule=read('AGENTS.md');
const recovery=read('.agents/skills/powerhouse-recovery-proof/SKILL.md');
const source=read('.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md');
const agents=read('platform/agents/agent-team.mjs');
const nativeFix=read('supabase/migrations/20261116105000_original_infinity_missing_signal_isolated_mux_v3.sql');

const tasksFor=(id)=>{
  const marker="id:'"+id+"',";
  const start=agents.indexOf(marker);
  assert.ok(start>=0,'existing agent identity missing: '+id);
  const tasksStart=agents.indexOf('tasks:[',start);
  const blockEnd=agents.indexOf('  }),',start);
  assert.ok(tasksStart>start && tasksStart<blockEnd,'existing tasks must belong to '+id);
  const tasksEnd=agents.indexOf('],',tasksStart);
  assert.ok(tasksEnd<blockEnd,'original tasks list bounded: '+id);
  return agents.slice(tasksStart,tasksEnd);
};

test('existing original 171 production patch preserves exact source-only failure isolation',()=>{
  assert.match(nativeFix,/powerhouse_runtime_scheduler_mux_v3/);
  assert.match(nativeFix,/powerhouse_runtime_scheduler_mux_v2\(p_now\)/);
  assert.match(nativeFix,/v_utc_minute\s*=\s*54/);
  assert.match(nativeFix,/POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED/);
  assert.match(nativeFix,/SOURCE_EVIDENCE_DUE/);
  assert.match(nativeFix,/v_base:=jsonb_set\(v_base,'\{healthy\}','false'::jsonb,true\)/);
  assert.match(nativeFix,/if SQLERRM <> 'POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED' then\s*raise;/);
  assert.doesNotMatch(nativeFix,/\bcron\.(?:schedule|unschedule|alter_job)\s*\(/i);
});

test('global agent policy never equates liveness, provider approval and terminal business proof',()=>{
  assert.match(globalRule,/2026-11-16 — P0 bewezen Infinity #171-foutisolatie/);
  assert.match(globalRule,/source-universe\|zero-current-eligible-signal\|20261116-v1/);
  assert.match(globalRule,/SOURCE_EVIDENCE_DUE/);
  assert.match(globalRule,/healthy=false/);
  assert.match(globalRule,/PROCESSED → FIX_TESTED → PROTECTED_RELEASED/);
  assert.match(globalRule,/413 contentoverdrachten en 14 innovaties/);
  assert.match(globalRule,/public\.brain_observe_failure/);
  assert.match(globalRule,/public\.brain_promote_failure/);
});

test('recovery skill requires next natural 07:41 run and native incident lifecycle',()=>{
  assert.match(recovery,/16 november 2026 — originele #171 recovery/);
  assert.match(recovery,/run:169000/);
  assert.match(recovery,/SOURCE_EVIDENCE_DUE/);
  assert.match(recovery,/healthy=false/);
  assert.match(recovery,/07:41/);
  assert.match(recovery,/NOT_YET_PROVEN/);
  assert.match(recovery,/public\.brain_promote_failure/);
  assert.match(recovery,/PROVEN/);
});

test('source intelligence skill rejects falsely green external-intelligence from mere fetch timestamps',()=>{
  assert.match(source,/16 november 2026 — geen bron-groen/);
  assert.match(source,/258 canonical signalen, 0/);
  assert.match(source,/72 in laatste 24 uur opgehaald, maar 0 geautoriseerd/);
  assert.match(source,/PROCESS_LIVENESS/);
  assert.match(source,/CURRENT_ELIGIBLE_SOURCE/);
  assert.match(source,/toegestaan=true/);
  assert.match(source,/TAVILY_432/);
  assert.match(source,/DATAFORSEO_REMOTE_FAILURE/);
});

test('four EXISTING owners retain bounded, nonduplicated tasks and ONE BRAIN truth',()=>{
  const required=[
    ['agent-integration-engineer','implement-original-171-source-exception-isolation-only-via-protected-merge-native-production-and-regression-proof'],
    ['agent-reliability','reconcile-original-171-0741-source-missing-task-receipt-vs-successful-parent-cron-without-false-green'],
    ['agent-data-quality','crosscheck-external-intelligence-current-eligible-7d-allowed-signal-vs-fresh-fetch-health-before-green'],
    ['agent-growth-market','recover-original-external-intelligence-provider-source-gates-and-prove-next-natural-infinity-consumer-outcome']
  ];
  for(const [agent,task] of required){
    const ownTasks=tasksFor(agent);
    assert.ok(ownTasks.includes("'"+task+"'"),agent+': missing responsibility');
    assert.equal(agents.split("'"+task+"'").length-1,1,agent+': responsibility repeated');
  }
  assert.doesNotMatch(agents,/id:'agent-infinity-recovery'|id:'agent-signal-universe-recovery'/);
});

test('canonical learning and evidence enforce no invented outcome',()=>{
  const learning=JSON.parse(read('brain/learning/2026-11-16-infinity-original-171-agent-skill-contract-v1.json'));
  assert.equal(learning.evidence.native_prod_migration,'20261116105000');
  assert.equal(learning.evidence.original_jobid,171);
  assert.equal(learning.evidence.target_daily_0741_run_proven,false);
  assert.equal(learning.evidence.fresh_eligible_signal_count_at_audit,0);
  assert.equal(learning.evidence.customer_outcome_proven,false);
  assert.equal(learning.rollout.production_verified,false);
  assert.deepEqual(learning.evaluation.historical_replay,['tests/brain-infinity-original-171-agent-skill-contract-20261116.test.mjs']);
});
