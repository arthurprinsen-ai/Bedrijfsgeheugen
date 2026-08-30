import test from 'node:test';
import assert from 'node:assert/strict';
import { createGithubCurrentStateInput } from '../brain/operating-loop/github-current-state-adapter.mjs';

test('GitHub workflow evidence becomes source-backed CurrentState input without extra polling', () => {
  const input=createGithubCurrentStateInput({
    tenantId:'tenant-a',
    repository:'arthurprinsen-ai/Bedrijfsgeheugen',
    sha:'abc123',
    runId:'33328047182',
    workflow:'Unified Brain Delivery',
    status:'completed',
    conclusion:'success',
    updatedAt:'2026-08-30T18:27:00Z'
  });
  assert.equal(input.source,'github');
  assert.equal(input.component,'github:arthurprinsen-ai/Bedrijfsgeheugen:Unified Brain Delivery');
  assert.equal(input.raw.repository,'arthurprinsen-ai/Bedrijfsgeheugen');
  assert.equal(input.raw.sha,'abc123');
  assert.equal(input.raw.run_id,'33328047182');
  assert.equal(input.raw.updated_at,'2026-08-30T18:27:00Z');
  assert.equal(input.health,'healthy');
  assert.equal(input.executionStatus,'completed');
  assert.equal(input.capacity,'available');
  assert.equal(input.revision,'abc123');
  assert.equal(input.owner,'github-actions');
  assert.equal(input.verified,true);
});

test('GitHub workflow state mapping is deterministic', () => {
  const base={tenantId:'t',repository:'o/r',sha:'s',runId:'1',workflow:'CI',updatedAt:'2026-08-30T18:27:00Z'};
  assert.equal(createGithubCurrentStateInput({...base,status:'in_progress'}).health,'healthy');
  assert.equal(createGithubCurrentStateInput({...base,status:'in_progress'}).executionStatus,'running');
  assert.equal(createGithubCurrentStateInput({...base,status:'completed',conclusion:'failure'}).health,'unhealthy');
  assert.equal(createGithubCurrentStateInput({...base,status:'completed',conclusion:'cancelled'}).capacity,'interrupted');
});

test('GitHub adapter fails closed on incomplete source identity', () => {
  const base={tenantId:'t',repository:'o/r',sha:'s',runId:'1',workflow:'CI',updatedAt:'2026-08-30T18:27:00Z',status:'completed',conclusion:'success'};
  assert.throws(()=>createGithubCurrentStateInput({...base,repository:''}),/repository/i);
  assert.throws(()=>createGithubCurrentStateInput({...base,sha:''}),/sha/i);
  assert.throws(()=>createGithubCurrentStateInput({...base,runId:''}),/runId/i);
  assert.throws(()=>createGithubCurrentStateInput({...base,updatedAt:''}),/updatedAt/i);
});
