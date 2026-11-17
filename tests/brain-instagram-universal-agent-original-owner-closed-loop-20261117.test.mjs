import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_AGENT_TEAM,ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS}
 from '../platform/agents/agent-team.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const tag='P0_ORIGINAL_ONE_LOOP_ALL14_AGENTS_20261117';
const specialists=[
 '.agents/skills/powerhouse-continuity/SKILL.md',
 '.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md',
 '.agents/skills/powerhouse-social-cro-funnel/SKILL.md',
 '.agents/skills/powerhouse-self-improvement-layer/SKILL.md',
 '.agents/skills/powerhouse-green-assurance/SKILL.md',
 '.agents/skills/powerhouse-autonomous-engineering-fabric/SKILL.md',
 '.agents/skills/instagram-composio-publisher/SKILL.md'
];

test('all fourteen ORIGINAL specialists inherit exactly one shared, auditable Brain→Heartbeat one-loop obligation',()=>{
 const ids=DEFAULT_AGENT_TEAM.map(a=>a.id);
 assert.equal(ids.length,14);
 assert.equal(new Set(ids).size,14);
 assert.equal(ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS.length,4);
 assert.equal(new Set(ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS).size,4);
 for(const a of DEFAULT_AGENT_TEAM){
  assert.ok(a.id.startsWith('agent-'),a.id);
  assert.ok(Array.isArray(a.tasks),a.id);
  assert.ok(Array.isArray(a.learningContracts),a.id);
  for(const item of ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS)
   assert.equal(a.tasks.filter(x=>x===item).length,1,a.id+' must bind exactly one '+item);
 }
 assert.ok(ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS.some(x=>x.includes('source-revision')));
 assert.ok(ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS.some(x=>x.includes('named-consumer')));
 assert.ok(ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS.some(x=>x.includes('heartbeat')));
 assert.ok(ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS.some(x=>x.includes('original-brain-fingerprint')));
 const src=read('platform/agents/agent-team.mjs');
 assert.equal((src.match(/\.\.\.ORIGINAL_ONE_LOOP_ALL_AGENT_TASKS,/g)||[]).length,14);
 assert.doesNotMatch(src,/cron\.schedule|setInterval\(|new Scheduler\(|createPublisher\(|provider\.post\(/);
});

test('all existing agent instructions and source/publisher, growth, recovery, engineering and assurance skills inherit original, not parallel, closed loop',()=>{
 const global=read('AGENTS.md');
 assert.ok(global.includes(tag));
 assert.ok(global.includes('ONE BRAIN'));
 assert.ok(global.includes('Heartbeat'));
 assert.ok(global.includes('source_revision'));
 assert.ok(global.includes('correlation_id'));
 assert.ok(global.includes('PROCESSED'));
 assert.ok(global.includes('17-nov Instagram'));
 for(const p of specialists){
  const s=read(p);
  assert.ok(s.startsWith('---\n'),'YAML frontmatter '+p);
  assert.ok(s.includes(tag),'missing single inherited policy '+p);
  assert.ok(s.includes('PROCESSED'),'missing named consumer status '+p);
  assert.ok(s.includes('Heartbeat'),'missing original effect consumer '+p);
  assert.match(s,/OPEN|DEGRADED/,'no false green '+p);
 }
});

test('original Mira source, exclusive publisher, native Meta, and Heartbeat source stages retain real evidence gates',()=>{
 const radar=read('supabase/functions/powerhouse-mira-problem-radar/index.ts');
 const local=read('supabase/functions/powerhouse-mira-problem-radar/distinct-source-queries.mjs');
 const metrics=read('supabase/functions/bg-social-metrics-sync/index.ts');
 const orch=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
 const ledger=read('docs/changes/2026-11-17-powerhouse-all14-agents-one-loop-closure.md');
 assert.match(radar,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(radar,/classifyMiraBusinessFriction/);
 assert.match(radar,/rotateDistinctMiraQueries\(runDate,selectCanonicalRadarSourceQueries\(runDate\)\)/);
 assert.match(local,/ORIGINAL_RADAR_EIGHT_CALL_SCOPE_REQUIRED/);
 assert.match(metrics,/reconcileOriginalPublicationMetricHandoffs/);
 assert.match(orch,/selectMeasuredNextPostTest/);
 assert.match(ledger,/\#120/);
 assert.match(ledger,/\#140/);
 assert.match(ledger,/\#171/);
 assert.match(ledger,/\#177/);
 assert.match(ledger,/Meta-(?:media-)?ID/);
 assert.match(ledger,/PROCESSED/);
 assert.match(ledger,/OPEN/);
 const team=read('platform/agents/agent-team.mjs');
 assert.doesNotMatch(team,/createNativeInstagramPost|GMAIL_SEND_EMAIL|SUPABASE_SERVICE_ROLE_KEY/);
});
