import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('../tools/content-growth/materialize-learning.mjs', import.meta.url));
const realFixture = fileURLToPath(new URL('../data/content-growth-events.json', import.meta.url));
const policy = fileURLToPath(new URL('../config/content-growth-policy.json', import.meta.url));

function execute(events, { useProductionSource = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-growth-source-boundary-'));
  const eventPath = path.join(dir, 'events.json');
  const outputPath = path.join(dir, 'learning.json');
  if (!useProductionSource) fs.writeFileSync(eventPath, JSON.stringify(events));
  try {
    const result = spawnSync(process.execPath, [script, useProductionSource ? realFixture : eventPath, policy, outputPath], { encoding: 'utf8' });
    return { ...result, output: fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : null };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('existing RVO problem radar input remains research, never fabricated performance', () => {
  const run = execute([], { useProductionSource: true });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.output.ingestion.input_events, 1);
  assert.equal(run.output.ingestion.excluded_source_only_events, 1);
  assert.equal(run.output.ingestion.performance_events, 0);
  assert.equal(run.output.confidence.observed_items, 0);
  assert.equal(run.output.confidence.proven_items, 0);
  assert.equal(run.output.commercial_totals.revenue, 0);
  assert.equal(run.output.commercial_totals.orders, 0);
  assert.deepEqual(run.output.exploit_candidates, []);
  assert.equal(run.output.evidence_status, 'NO_OBSERVED_CONTENT_PERFORMANCE');
});

test('source-only event with misleading content_id, value and attribution cannot score', () => {
  const run = execute([
    { event_id:'research-1', content_id:'blog:fictional', event_type:'problem_radar_signal_accepted', value:999999, attribution:'last_touch' },
    { event_id:'click-1', content_id:'blog:observed', event_type:'click', value:0 }
  ]);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.output.ingestion.excluded_source_only_events, 1);
  assert.equal(run.output.ingestion.performance_events, 1);
  assert.equal(run.output.confidence.observed_items, 1);
  assert.equal(run.output.commercial_totals.revenue, 0);
  assert.deepEqual(run.output.candidate_scores, { 'blog:observed': 4 });
  assert.equal(run.output.evidence_status, 'PERFORMANCE_EVENTS_PRESENT_PROVIDER_ATTRIBUTION_UNVERIFIED');
});

test('orphan commercial revenue cannot be relabeled as a source-only research signal', () => {
  const run = execute([{ event_id:'orphan-r1', event_type:'revenue', value:1000, attribution:'last_touch' }]);
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /content_id is required/);
  assert.equal(run.output, null);
});

test('malformed unrelated content measurement still fails closed', () => {
  const run = execute([{ event_type:'click', value:1 }]);
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /content_id is required/);
  assert.equal(run.output, null);
});
