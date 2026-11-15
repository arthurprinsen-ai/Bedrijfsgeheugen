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
    const canonical={ idempotency_key:'obligation|abc', record_type:'AgentWork', obligation_id:'supabase-performance-evidence-daily', owner_agent:'agent-performance', trace_id:'trace-1', state:'PENDING', record:{ requestedOutcome:'measurement' } };
    if (init.method === 'POST') return jsonResponse(201, [canonical]);
    return jsonResponse(200, [canonical]);
  };
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const persisted = await stores.workStore.putIfAbsent({ type:'AgentWork', idempotencyKey:'obligation|abc', obligationId:'supabase-performance-evidence-daily', ownerAgent:'agent-performance', traceId:'trace-1', state:'PENDING', requestedOutcome:'measurement' });
  assert.equal(persisted.record.idempotencyKey, 'obligation|abc');
  assert.equal(persisted.record.type, 'AgentWork');
  assert.equal(persisted.created, true);
  assert.equal(calls[0].init.method, 'POST');
  assert.match(calls[0].init.headers.Prefer, /resolution=ignore-duplicates,return=representation/);
  assert.equal(calls[0].init.headers.apikey, TOKEN);
  assert.equal(calls[0].init.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(calls[1].init.method, 'GET');
});

test('recovery records share the durable dispatch ledger but keep their record type', async () => {
  const canonical={ idempotency_key:'recovery|obligation|abc', record_type:'RecoveryWork', obligation_id:'supabase-performance-evidence-daily', owner_agent:'agent-performance', trace_id:'trace-1', state:'RECOVERING', record:{} };
  const fetchImpl = async (url, init={}) => init.method === 'POST'
    ? jsonResponse(201, [canonical])
    : jsonResponse(200, [canonical]);
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const persisted = await stores.recoveryStore.putIfAbsent({ type:'RecoveryWork', idempotencyKey:'recovery|obligation|abc', obligationId:'supabase-performance-evidence-daily', ownerAgent:'agent-performance', traceId:'trace-1', state:'RECOVERING' });
  assert.equal(persisted.record.type, 'RecoveryWork');
  assert.equal(persisted.created, true);
});

test('existing immutable AgentWork replay is not reported as a newly created handoff', async () => {
  const canonical={ idempotency_key:'obligation|abc', record_type:'AgentWork',
    obligation_id:'supabase-performance-evidence-daily',owner_agent:'agent-performance',
    trace_id:'trace-1',state:'PENDING',record:{requestedOutcome:'measurement'} };
  let stored=null;const calls=[];
  const fetchImpl=async (url,init={})=>{
    calls.push({url:String(url),init});
    if(init.method==='POST'){
      const inserted=stored===null;
      if(inserted)stored=JSON.parse(init.body);
      return jsonResponse(201,inserted?[stored]:[]);
    }
    return jsonResponse(200,stored?[stored]:[]);
  };
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  const request={type:'AgentWork',idempotencyKey:'obligation|abc',
    obligationId:'supabase-performance-evidence-daily',ownerAgent:'agent-performance',
    traceId:'trace-1',state:'PENDING',requestedOutcome:'measurement'};
  const first=await stores.workStore.putIfAbsent(request);
  const replay=await stores.workStore.putIfAbsent(request);
  assert.equal(first.created,true);
  assert.equal(replay.created,false);
  assert.deepEqual(first.record,replay.record);
  assert.equal(calls.filter(x=>x.init.method==='POST').length,2,'one atomic conflict-safe insert per invocation');
  assert.ok(calls.filter(x=>x.init.method==='POST').every(x=>x.init.headers.Prefer.includes('return=representation')));
});

test('immutable idempotency key cannot silently transfer ownership on duplicate replay',async()=>{
  const existing={idempotency_key:'obligation|abc',record_type:'AgentWork',
    obligation_id:'canonical-original',owner_agent:'agent-reliability',
    trace_id:'trace-1',state:'PENDING',record:{}};
  const fetchImpl=async (url,init={})=>init.method==='POST'
    ?jsonResponse(201,[]):jsonResponse(200,[existing]);
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  await assert.rejects(
    stores.workStore.putIfAbsent({type:'AgentWork',idempotencyKey:'obligation|abc',
      obligationId:'canonical-original',ownerAgent:'agent-performance',
      traceId:'trace-1',state:'PENDING'}),
    /immutable dispatch identity conflict \(ownerAgent\)/
  );
});

test('provider fails to report insert outcome: no fabricated new durable dispatch',async()=>{
  const fetchImpl=async(url,init={})=>init.method==='POST'
    ?new Response(null,{status:204}):jsonResponse(200,[]);
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  await assert.rejects(stores.recoveryStore.putIfAbsent({
    type:'RecoveryWork',idempotencyKey:'recovery|abc',
    obligationId:'original-abc',ownerAgent:'agent-reliability',
    traceId:'trace-abc',state:'RECOVERING'
  }),/dispatch insert outcome unverified/);
});

test('provider-reported new insert must match the exact original immutable key',async()=>{
  const canonical={idempotency_key:'obligation|abc',record_type:'AgentWork',
    obligation_id:'original-abc',owner_agent:'agent-reliability',
    trace_id:'trace-abc',state:'PENDING',record:{}};
  const fetchImpl=async(url,init={})=>init.method==='POST'
    ?jsonResponse(201,[{...canonical,idempotency_key:'wrong-key'}])
    :jsonResponse(200,[canonical]);
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  await assert.rejects(stores.workStore.putIfAbsent({
    type:'AgentWork',idempotencyKey:'obligation|abc',
    obligationId:'original-abc',ownerAgent:'agent-reliability',
    traceId:'trace-abc',state:'PENDING'
  }),/inserted dispatch identity unverified/);
});

test('dispatch stores list only their canonical record type for backfill collection', async () => {
  const calls = [];
  const fetchImpl = async (url, init={}) => {
    calls.push({ url:String(url), init });
    const recordType = String(url).includes('record_type=eq.RecoveryWork') ? 'RecoveryWork' : 'AgentWork';
    const row={ idempotency_key:`${recordType.toLowerCase()}|1`, record_type:recordType, obligation_id:'material-change-production-verification', owner_agent:'agent-reliability', trace_id:'trace-list', state:recordType === 'RecoveryWork' ? 'RECOVERING' : 'PENDING', record:{ triggerFingerprint:'list-test' } };
    return new Response(JSON.stringify([row]),{status:206,headers:{'content-type':'application/json','Content-Range':'0-0/1'}});
  };
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const workRows = await stores.workStore.list();
  const recoveryRows = await stores.recoveryStore.list();
  assert.deepEqual(workRows.map(row => row.type), ['AgentWork']);
  assert.deepEqual(recoveryRows.map(row => row.type), ['RecoveryWork']);
  assert.ok(calls.every(call => call.init.method === 'GET'));
  assert.match(calls[0].url, /record_type=eq\.AgentWork/);
  assert.match(calls[1].url, /record_type=eq\.RecoveryWork/);
  assert.match(calls[0].url, /order=created_at\.asc/);
});

test('original AgentWork and RecoveryWork lists exhaust more than 1000 immutable rows despite provider page cap', async () => {
  const calls=[];
  const allRows=Array.from({length:1201},(_,i)=>({
    idempotency_key:`obligation|historical-${String(i).padStart(5,'0')}`,
    record_type:'AgentWork',obligation_id:'material-change-production-verification',
    owner_agent:'agent-reliability',trace_id:'trace-full-history',state:'PENDING',
    created_at:'2026-09-16T00:00:00Z',record:{triggerFingerprint:'historical'}
  }));
  const fetchImpl=async (url,init={})=>{
    const [first,requestedLast]=String(init.headers.Range).split('-').map(Number);
    calls.push({url:String(url),init});
    assert.equal(init.headers.Prefer,'count=exact');
    assert.equal(init.headers['Range-Unit'],'items');
    assert.match(String(url),/order=created_at\.asc,idempotency_key\.asc/);
    const page=allRows.slice(first,Math.min(requestedLast+1,first+300));
    return new Response(JSON.stringify(page),{status:206,headers:{
      'content-type':'application/json',
      'Content-Range':`${first}-${first+page.length-1}/${allRows.length}`
    }});
  };
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  const all=await stores.workStore.list();
  assert.equal(all.length,1201,'every immutable dispatch is retained');
  assert.equal(new Set(all.map(x=>x.idempotencyKey)).size,1201);
  assert.equal(all.at(0).idempotencyKey,'obligation|historical-00000');
  assert.equal(all.at(-1).idempotencyKey,'obligation|historical-01200');
  assert.deepEqual(calls.map(c=>c.init.headers.Range),['0-499','300-799','600-1099','900-1399','1200-1699']);
});

test('smaller provider result than expected count never silently counts as whole historical backlog',async()=>{
  const calls=[];
  const fetchImpl=async(url,init={})=>{
    const from=Number(init.headers.Range.split('-')[0]);calls.push(from);
    const rows=Array.from({length:Math.min(100,1100-from)},(_,i)=>({
      idempotency_key:`recovery|${String(from+i).padStart(4,'0')}`,
      record_type:'RecoveryWork',obligation_id:'original-recovery',
      owner_agent:'agent-reliability',trace_id:'original-recovery-trace',
      state:'RECOVERING',created_at:'2026-09-17T00:00:00Z',record:{}
    }));
    return new Response(JSON.stringify(rows),{status:206,headers:{'Content-Range':`${from}-${from+rows.length-1}/1100`,'content-type':'application/json'}});
  };
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  const all=await stores.recoveryStore.list();
  assert.equal(all.length,1100);
  assert.equal(calls.length,11);
  assert.equal(new Set(all.map(x=>x.idempotencyKey)).size,1100);
});

test('a missing exact Content-Range fails closed rather than returning first-page success',async()=>{
  const rows=[{idempotency_key:'obligation|0',record_type:'AgentWork',state:'PENDING'}];
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,
    fetchImpl:async()=>jsonResponse(200,rows)});
  await assert.rejects(stores.workStore.list(),/dispatch exact Content-Range missing/);
});

test('source count drift between historical pages fails instead of silently losing records',async()=>{
  const fetchImpl=async(url,init={})=>{
    const from=Number(init.headers.Range.split('-')[0]);
    const rows=Array.from({length:500},(_,i)=>({
      idempotency_key:`obligation|${String(from+i).padStart(5,'0')}`,
      record_type:'AgentWork',state:'PENDING',created_at:'2026-09-16T00:00:00Z'
    }));
    return new Response(JSON.stringify(rows),{status:206,headers:{
      'content-type':'application/json',
      'Content-Range':`${from}-${from+499}/${from===0?1100:1101}`
    }});
  };
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  await assert.rejects(stores.workStore.list(),/dispatch page incomplete or source changed/);
});

test('duplicate identity or incorrect page offset cannot silently erase a backfill item',async()=>{
  const fetchImpl=async(url,init={})=>{
    const from=Number(init.headers.Range.split('-')[0]);
    const size=from===0?500:1;
    const rows=Array.from({length:size},(_,i)=>({
      idempotency_key:`obligation|${String(from===0?i:0).padStart(4,'0')}`,
      record_type:'AgentWork',state:'PENDING',created_at:'2026-09-16T00:00:00Z'
    }));
    return new Response(JSON.stringify(rows),{status:206,headers:{
      'content-type':'application/json','Content-Range':`${from}-${from+size-1}/501`
    }});
  };
  const stores=createSupabaseOutcomeObligationStores({url:URL,token:TOKEN,fetchImpl});
  await assert.rejects(stores.workStore.list(),/dispatch page identity mismatch or duplicate/);
});

test('evidence store reads only metadata required by the executor', async () => {
  const fetchImpl = async () => jsonResponse(200, [{ evidence_ref:'performance:measurement:1', evidence_type:'FUNCTIONAL_READBACK', independent:true, accepted:true, exact_production:false, metadata:{ source:'supabase-performance', producer:'PRODUCTION_READBACK', taskIdentity:'O1', candidateIdentity:'C1', productionIdentity:'P1' } }]);
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const rows = await stores.evidenceStore.list('obligation|abc');
  assert.deepEqual(rows, [{ ref:'performance:measurement:1', type:'FUNCTIONAL_READBACK', producer:'PRODUCTION_READBACK', taskIdentity:'O1', candidateIdentity:'C1', productionIdentity:'P1', independent:true, accepted:true, exactProduction:false, metadata:{ source:'supabase-performance', producer:'PRODUCTION_READBACK', taskIdentity:'O1', candidateIdentity:'C1', productionIdentity:'P1' } }]);
});

test('evidence putIfAbsent writes one canonical row and coalesces an exact replay', async () => {
  const calls = [];
  let persisted = null;
  const fetchImpl = async (url, init={}) => {
    calls.push({ url:String(url), init });
    if (init.method === 'POST') {
      persisted = JSON.parse(init.body);
      return jsonResponse(201, []);
    }
    return jsonResponse(200, persisted ? [persisted] : []);
  };
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl });
  const record = { idempotencyKey:'obligation|abc', ref:'progress:deels-live:sha-1', type:'PROGRESS_CLAIM', producer:'COMPLETION_SUPERVISOR', taskIdentity:'O1', candidateIdentity:'C1', independent:false, accepted:false, metadata:{ claim:'DEELS LIVE' } };
  const first = await stores.evidenceStore.putIfAbsent(record);
  const second = await stores.evidenceStore.putIfAbsent(record);
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(calls.filter(call => call.init.method === 'POST').length, 1);
  assert.equal(persisted.evidence_ref, record.ref);
  assert.equal(persisted.metadata.producer, 'COMPLETION_SUPERVISOR');
});

test('remote auth or validation errors fail closed instead of degrading to empty state', async () => {
  const stores = createSupabaseOutcomeObligationStores({ url:URL, token:TOKEN, fetchImpl:async () => jsonResponse(401, { message:'unauthorized' }) });
  await assert.rejects(() => stores.workStore.get('obligation|abc'), /Supabase outcome obligation store failed.*401/);
});

test('migration is server-only, append-only and independently idempotent for dispatch and evidence', async () => {
  const sql = await readFile('supabase/migrations/20260830182111_brain_outcome_obligation_store.sql', 'utf8');
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
