import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSupabaseOutcomeObligationStores } from '../tools/outcome-obligation-supabase-store.mjs';

const URL = 'https://example.supabase.co';
const TOKEN = 'service-role-test-token';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers:{ 'content-type':'application/json' } });
}

test('store construction fails closed without server-only Supabase credentials', () => {
  assert.throws(() => createSupabaseOutcomeObligationStores({ url:'', token:TOKEN }), /url/i);
  assert.throws(() => createSupabaseOutcomeObligationStores({ url:URL, token:'' }), /token/i);
});

test('AgentWork putIfAbsent is idempotent and returns the canonical persisted record', async () => {
  const calls = [];
  const fetchImpl = async (url, init={}) => {
    calls.push({ url:String(url), init });
    if (init.method === 'POST') return jsonResponse(201, []);
    return jsonResponse(200, [{ idempotency_key:'obligation|abc', record_type:'AgentWork', obligation_id:'supabase-performance-evidence-daily', owner_agent:'agent-performance', trace_id:'trace-1', state:'PENDING', record:{ requestedOutcome:'measurement' } }]);
  };
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const persisted = await stores.workStore.putIfAbsent({ type:'AgentWork', idempotencyKey:'obligation|abc', obligationId:'supabase-performance-evidence-daily', ownerAgent:'agent-performance', traceId:'trace-1', state:'PENDING', requestedOutcome:'measurement' });
  assert.equal(persisted.record.idempotencyKey, 'obligation|abc');
  assert.equal(persisted.record.type, 'AgentWork');
  assert.equal(calls[0].init.method, 'POST');
  assert.match(calls[0].init.headers.Prefer, /resolution=ignore-duplicates/);
  assert.equal(calls[0].init.headers.apikey, TOKEN);
  assert.equal(calls[0].init.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(calls[1].init.method, 'GET');
});

test('recovery records share the durable dispatch ledger but keep their record type', async () => {
  const fetchImpl = async (url, init={}) => init.method === 'POST'
    ? jsonResponse(201, [])
    : jsonResponse(200, [{ idempotency_key:'recovery|obligation|abc', record_type:'RecoveryWork', obligation_id:'supabase-performance-evidence-daily', owner_agent:'agent-performance', trace_id:'trace-1', state:'RECOVERING', record:{} }]);
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const persisted = await stores.recoveryStore.putIfAbsent({ type:'RecoveryWork', idempotencyKey:'recovery|obligation|abc', obligationId:'supabase-performance-evidence-daily', ownerAgent:'agent-performance', traceId:'trace-1', state:'RECOVERING' });
  assert.equal(persisted.record.type, 'RecoveryWork');
});

test('evidence store reads only metadata required by the executor', async () => {
  const fetchImpl = async () => jsonResponse(200, [{ evidence_ref:'performance:measurement:1', evidence_type:'outcome', independent:true, accepted:true, exact_production:false, metadata:{ source:'supabase-performance' } }]);
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const rows = await stores.evidenceStore.list('obligation|abc');
  assert.deepEqual(rows, [{ ref:'performance:measurement:1', type:'outcome', independent:true, accepted:true, exactProduction:false, metadata:{ source:'supabase-performance' } }]);
});

test('remote auth or validation errors fail closed instead of degrading to empty state', async () => {
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl:async () => jsonResponse(401, { message:'unauthorized' }) });
  await assert.rejects(() => stores.workStore.get('obligation|abc'), /Supabase outcome obligation store failed.*401/);
});

test('migration is server-only, append-only and independently idempotent for dispatch and evidence', async () => {
  const sql = await readFile('supabase/migrations/20260830_brain_outcome_obligation_store.sql', 'utf8');
  for (const required of [
    'create table if not exists public.brain_outcome_obligation_dispatch',
    'idempotency_key text primary key',
    "record_type text not null check (record_type in ('AgentWork', 'RecoveryWork'))",
    'create table if not exists public.brain_outcome_obligation_evidence',
    'unique (idempotency_key, evidence_ref)',
    'enable row level security',
    'revoke all on table public.brain_outcome_obligation_dispatch from anon, authenticated',
    'revoke all on table public.brain_outcome_obligation_evidence from anon, authenticated',
    'grant select, insert on table public.brain_outcome_obligation_dispatch to service_role',
    'grant select, insert on table public.brain_outcome_obligation_evidence to service_role',
    'before update or delete on public.brain_outcome_obligation_dispatch',
    'before update or delete on public.brain_outcome_obligation_evidence',
  ]) assert.ok(sql.includes(required), `${required} must be present`);
});
