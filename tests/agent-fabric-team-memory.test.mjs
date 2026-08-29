import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../platform/agents/agent-registry.mjs';
import { createAgentFabric } from '../platform/agents/agent-fabric.mjs';
import { createDefaultAgentRegistry, DEFAULT_AGENT_TEAM } from '../platform/agents/agent-team.mjs';
import { createTeamMemoryBridge } from '../platform/agents/team-memory-bridge.mjs';

function eventSink() {
  const events=[];
  return { append:event=>{ events.push(event); return event; }, all:()=>[...events] };
}

test('default team contains every approved specialist as one shared registry', () => {
  const expected = [
    'agent-reliability','agent-security','agent-cost','agent-performance','agent-data-quality',
    'agent-website-ux','agent-seo-content','agent-growth-market','agent-integration-make',
    'agent-governance-ai-act','agent-product-opportunity',
  ];
  assert.deepEqual(DEFAULT_AGENT_TEAM.map(a=>a.id).sort(), expected.sort());
  assert.equal(createDefaultAgentRegistry().all().length, 11);
});

test('Fabric emits coordination events for assignment, transition and learning reuse', () => {
  const sink=eventSink();
  const registry=createAgentRegistry([
    {id:'agent-seo',domains:['Website','SEO'],capabilities:['analyze']},
    {id:'agent-ux',domains:['Website','UX'],capabilities:['analyze']},
  ]);
  const fabric=createAgentFabric({registry,eventSink:sink});
  const work=fabric.intake({tenantId:'T1',problemClass:'meta-regression',domains:['Website','SEO','UX'],capabilities:['analyze'],affectedObjectIds:['home'],problem:'metadata regression'});
  fabric.transition({workId:work.id,status:'Investigating'});
  const types=sink.all().map(e=>e.type);
  assert.deepEqual(types.slice(0,2),['AGENT_WORK_ASSIGNED','AGENT_WORK_TRANSITIONED']);
  for (const event of sink.all()) {
    assert.equal(event.tenantId,'T1');
    assert.equal(event.workId,work.id);
    assert.ok(event.fingerprint);
    assert.ok(event.occurredAt);
  }
});

test('bridge writes material outcomes in existing BG166/BG168 schema without raw private context', () => {
  const bridge=createTeamMemoryBridge();
  const event=bridge.toMaterialOutcome({
    tenantId:'T1',
    work:{id:'WORK-1',primaryAgentId:'agent-cost',supportAgentIds:['agent-performance'],problem:'Make operations too high',status:'LearningRecorded'},
    meta:{problemClass:'make-cost-spike',domains:['Cost','Performance'],fingerprint:'fp-123'},
    outcomeType:'IMPROVEMENT',
    evidence:['cost-before:100','cost-after:70'],
    action:'batch and cache calls',
    verification:'production cost metric green',
    rollback:'restore previous Make mappings',
    metric:'make_operations',
    confidence:0.94,
    reusableLesson:'Batch repeated reads and verify operation count.',
    rawContext:'SECRET-SHOULD-NOT-LEAK',
  });
  assert.equal(event.type,'IMPROVEMENT');
  assert.equal(event.owner_agent,'agent-cost');
  assert.equal(event.fingerprint,'fp-123');
  assert.match(event.verification,/green/);
  assert.equal(JSON.stringify(event).includes('SECRET-SHOULD-NOT-LEAK'),false);
});

test('bridge converts bounded BG167 briefing records into tenant-scoped evidence candidates', () => {
  const bridge=createTeamMemoryBridge();
  const candidates=bridge.fromSharedContext({
    tenantId:'T1',
    requesterDomains:['SEO','Website'],
    records:[
      {fingerprint:'seo|canonical',domains:['SEO'],lesson:'canonical tags need one owner',verification:'prod green',owner_agent:'agent-seo-content'},
      {fingerprint:'security|headers',domains:['Security'],lesson:'unrelated',verification:'prod green',owner_agent:'agent-security'},
      {fingerprint:'seo|bad',domains:['SEO'],lesson:'not verified',verification:'pending',owner_agent:'agent-seo-content'},
    ],
  });
  assert.equal(candidates.length,1);
  assert.equal(candidates[0].fingerprint,'seo|canonical');
  assert.equal(candidates[0].tenantId,'T1');
  assert.equal(candidates[0].kind,'VERIFIED_TEAM_LEARNING');
});
