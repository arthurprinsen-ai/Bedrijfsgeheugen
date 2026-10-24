import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { partitionContentGrowthInputs } from '../tools/content-growth/source-integrity.mjs';
import { aggregateContentPerformance } from '../tools/content-growth/aggregate.mjs';
import { buildLearningContext } from '../tools/content-growth/learning.mjs';

const actual = JSON.parse(fs.readFileSync(new URL('../data/content-growth-events.json', import.meta.url), 'utf8'));
test('real repository evidence snapshot separates public radar signals from measured performance', () => {
  const partition = partitionContentGrowthInputs(actual, { now: new Date('2026-10-24T09:00:00+02:00') });
  assert.equal(partition.provenance.measurement_status,'NO_ATTRIBUTED_PERFORMANCE_EVENTS');
  assert.equal(partition.provenance.performance_event_count,0);
  assert.ok(partition.provenance.external_research_count>=1);
  assert.equal(partition.researchObservations.some(x=>x.deadline_status==='EXPIRED'),true);
  assert.equal(partition.researchObservations.every(x=>x.is_performance_measurement===false),true);
  const learning = buildLearningContext({ performance: aggregateContentPerformance(partition.performanceEvents,{weights:{}}), policy: {} });
  assert.equal(learning.confidence.observed_items,0);
  assert.equal(learning.confidence.proven_items,0);
});
test('attributable real events pass through and untracked metrics fail closed', () => {
  const event={event_id:'real-1',content_id:'blog:source-backed',event_type:'click',source:'ga4'};
  const partition=partitionContentGrowthInputs([event], {now:new Date('2026-10-24T08:00:00Z')});
  assert.deepEqual(partition.performanceEvents,[event]);
  assert.equal(partition.provenance.measurement_status,'ATTRIBUTED_EVENTS_AVAILABLE');
  assert.throws(()=>partitionContentGrowthInputs([{event_type:'lead',value:8}]),/UNATTRIBUTED_METRIC/);
  assert.throws(()=>partitionContentGrowthInputs([{event_type:'made_up',content_id:'blog:x'}]),/UNCLASSIFIED_EVENT/);
  assert.throws(()=>partitionContentGrowthInputs([{...event},{...event}]),/DUPLICATE_EVENT_ID/);
});
test('external research needs a dated, traceable URL and cannot masquerade as fresh performance', () => {
  const research={event_type:'problem_radar_signal_accepted', source:{publisher:'RVO',url:'https://www.rvo.nl/subsidies-financiering/aanzet',source_date:'2026-09-18'}, signal:{problem_summary:'Een concreet beslissingssignaal'}};
  const p=partitionContentGrowthInputs([research],{now:new Date('2026-10-24')});
  assert.equal(p.researchObservations[0].deadline_status,'UNKNOWN');
  assert.throws(()=>partitionContentGrowthInputs([{...research,source:{...research.source,url:'javascript:alert(1)'}}]),/EXTERNAL_EVIDENCE_INVALID/);
  assert.throws(()=>partitionContentGrowthInputs([{...research,source:{...research.source,source_date:'2026-02-30'}}]),/EXTERNAL_EVIDENCE_INVALID/);
});
