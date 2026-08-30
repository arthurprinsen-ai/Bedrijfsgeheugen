import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseCurrentStateInput } from '../brain/operating-loop/supabase-current-state-adapter.mjs';

test('maps verified successful Supabase operation evidence into canonical CurrentState input',()=>{
  const input=createSupabaseCurrentStateInput({tenantId:'tenant-a',table:'brain_delivery_evidence',rowId:'row-123',updatedAt:'2026-08-30T18:45:00Z',operationStatus:'success',operation:'insert',revision:'migration-20260830'});
  assert.equal(input.source,'supabase');
  assert.equal(input.id,'supabase-current-state:brain_delivery_evidence:row-123');
  assert.equal(input.component,'supabase:brain_delivery_evidence');
  assert.equal(input.raw.table,'brain_delivery_evidence');
  assert.equal(input.raw.row_id,'row-123');
  assert.equal(input.raw.updated_at,'2026-08-30T18:45:00Z');
  assert.equal(input.health,'healthy');
  assert.equal(input.executionStatus,'completed');
  assert.equal(input.capacity,'available');
  assert.equal(input.revision,'migration-20260830');
  assert.equal(input.verified,true);
});

test('maps running failed and interrupted operation evidence deterministically',()=>{
  const base={tenantId:'tenant-a',table:'events',rowId:'row-1',updatedAt:'2026-08-30T18:45:00Z',operation:'write'};
  const running=createSupabaseCurrentStateInput({...base,operationStatus:'running'});
  assert.equal(running.health,'healthy');
  assert.equal(running.executionStatus,'running');
  const failed=createSupabaseCurrentStateInput({...base,rowId:'row-2',operationStatus:'failed',errorCode:'23505'});
  assert.equal(failed.health,'unhealthy');
  assert.equal(failed.executionStatus,'failed');
  assert.equal(failed.error,'SUPABASE_OPERATION_FAILED:23505');
  const interrupted=createSupabaseCurrentStateInput({...base,rowId:'row-3',operationStatus:'cancelled'});
  assert.equal(interrupted.health,'degraded');
  assert.equal(interrupted.capacity,'interrupted');
  assert.equal(interrupted.executionStatus,'interrupted');
});

test('unknown operation status stays explicit unknown instead of inventing health',()=>{
  const input=createSupabaseCurrentStateInput({tenantId:'tenant-a',table:'events',rowId:'row-x',updatedAt:'2026-08-30T18:45:00Z',operationStatus:'observed'});
  assert.equal(input.health,'unknown');
  assert.equal(input.capacity,'unknown');
  assert.equal(input.executionStatus,'unknown');
  assert.equal(input.error,'SUPABASE_OPERATION_STATE_UNKNOWN');
});

test('fails closed without registered Supabase provenance fields',()=>{
  assert.throws(()=>createSupabaseCurrentStateInput({tenantId:'tenant-a'}),/table/);
  assert.throws(()=>createSupabaseCurrentStateInput({tenantId:'tenant-a',table:'events'}),/rowId/);
  assert.throws(()=>createSupabaseCurrentStateInput({tenantId:'tenant-a',table:'events',rowId:'row'}),/updatedAt/);
});
