import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeScanEnvelope,buildRuntimeEvent} from '../platform/scans/canonical-scan.mjs';

const selfscan={submission_key:'bedrijfslek-20261009-abcdef',canonical:'https://www.bedrijfsgeheugen.nl/zelfscan',scan:{score:63,niveau:4,dimAvg:{verkoop:2.5,continuiteit:1.67}}};
test('Bedrijfslek uses existing scan contract and aggregate-only Brain lineage',()=>{
  const normalized=normalizeScanEnvelope(selfscan);
  assert.equal(normalized.kind,'bedrijfslek_scan');
  assert.equal(normalized.companyKey,null);
  assert.equal(normalized.tenantIdentityStatus,'unverified');
  const event=buildRuntimeEvent(normalized,'scan-id');
  assert.equal(event.source,'website.bedrijfslek');
  assert.equal(event.dedupe_key,'scan:bedrijfslek-20261009-abcdef');
  assert.equal(event.context.learning_scope,'aggregate_only');
  assert.equal(event.context.dimensions.continuiteit,1.67);
});
test('existing Frisse Blik and workshop canonical types remain unchanged',()=>{
  for(const [path,kind,source] of [
    ['/frisse-blik','frisse_blik','website.frisse_blik'],
    ['/scan','workshop_scan','website.workshop_scan']
  ]){
    const normalized=normalizeScanEnvelope({...selfscan,canonical:'https://www.bedrijfsgeheugen.nl'+path});
    assert.equal(normalized.kind,kind);
    assert.equal(buildRuntimeEvent(normalized,'scan-id').source,source);
  }
});
test('foreign domains and similarly prefixed selfscan paths are rejected',()=>{
  for(const canonical of [
    'https://example.com/zelfscan','https://www.bedrijfsgeheugen.nl/zelfscan-evil',
    'https://www.bedrijfsgeheugen.nl/zelfscan/claim','http://www.bedrijfsgeheugen.nl/zelfscan'
  ])assert.throws(()=>normalizeScanEnvelope({...selfscan,canonical}),/INVALID_CANONICAL/);
});
test('privacy and numerical boundaries stay intact',()=>{
  assert.throws(()=>normalizeScanEnvelope({...selfscan,scan:{score:101,dimAvg:{verkoop:2}}}),/INVALID_SCORE/);
  assert.throws(()=>normalizeScanEnvelope({...selfscan,scan:{score:50,dimAvg:{verkoop:900}}}),/INVALID_DIMENSIONS/);
});
test('actual Edge ingest writes to existing scan, runtime and growth stores without extra schedule',async()=>{
  const s=await readFile(new URL('../supabase/functions/powerhouse-scan-ingest/index.ts',import.meta.url),'utf8');
  assert.match(s,/const isBedrijfslek=canonical===/);
  assert.match(s,/kind=isBedrijfslek\?'bedrijfslek_scan'/);
  assert.match(s,/website\.bedrijfslek/);
  assert.match(s,/scan_inzendingen/);
  assert.match(s,/powerhouse_runtime_events/);
  assert.match(s,/growth_events/);
  assert.match(s,/funnel_stage:scan\.kind==='bedrijfslek_scan'\?'assessment':'lead'/);
  assert.match(s,/page_role:'diagnosis'/);
  assert.match(s,/onConflict:'submission_key',ignoreDuplicates:true/);
  assert.match(s,/x-bg-service-token/);
});
test('selfscan shows full free value before async persistence and never submits contact PII',async()=>{
  const s=await readFile(new URL('../zelfscan.html',import.meta.url),'utf8');
  assert.match(s,/toon\('s-score'\);\s*bgScanNaarBrein\(score,per\)/);
  assert.match(s,/fetch\('\/api\/powerhouse-scan-ingest'/);
  assert.match(s,/BG_SCAN_KEY=bgMaakScanKey\(\)/);
  assert.match(s,/id="bgBrainStatus"/);
  const fn=s.split('function bgScanNaarBrein(score,per){')[1]?.split('var TEAMUITDAGING')[0]||'';
  assert.match(fn,/source_kind:'bedrijfslek_scan'/);
  assert.doesNotMatch(fn,/\b(email|phone|contact_name|company_name|telefoon|naam)\s*:/i);
});

test('Portal V2 only exposes scans after authenticated tenancy and explicit claim',async()=>{
  const bridge=await readFile(new URL('../portal-v2/scan-claim-bridge.js',import.meta.url),'utf8');
  const app=await readFile(new URL('../portal-v2/app.js',import.meta.url),'utf8');
  const api=await readFile(new URL('../netlify/functions/portal-scans.mjs',import.meta.url),'utf8');
  assert.match(app,/createScanClaimBridge\(\{authHeaders:\(\)=>portalStateClient\.authHeaders\(\)\}\)/);
  assert.match(app,/scanClaimBridge\.setAuthenticated\(authenticated\)/);
  assert.match(bridge,/if\(!authenticated\)return/);
  assert.match(bridge,/tenant_identity_status==='verified'/);
  assert.match(bridge,/GET|fetcher\('\/api\/portal-scans'/);
  assert.match(bridge,/body:JSON\.stringify\(\{submission_key:submissionKey\}\)/);
  assert.match(bridge,/data\?\.claimed!==true/);
  assert.doesNotMatch(bridge,/\btenant_id\s*:/);
  assert.match(api,/resolveIdentityTenant\(user\)/);
  assert.match(api,/if\(!user\?\.id\)return json\(\{error:'UNAUTHORIZED'\},401\)/);
  assert.match(api,/action:'claim',tenant_id:tenantId/);
});

test('existing ONE BRAIN decision-cycle trigger admits only the three canonical scan signals',async()=>{
  const sql=await readFile(new URL('../supabase/migrations/20261009185500_bedrijfslek_runtime_signal_cycle_v1.sql',import.meta.url),'utf8');
  for(const source of ['website.frisse_blik','website.workshop_scan','website.bedrijfslek'])assert.ok(sql.includes(source));
  assert.match(sql,/powerhouse_open_cycle_from_runtime_signal_v1\(p_event_id uuid\)/);
  assert.match(sql,/powerhouse_runtime_signal_cycle_trigger_v1\(\)/);
  assert.match(sql,/on conflict \(tenant_id,cycle_id\)/i);
  assert.match(sql,/if exists \([\s\S]*?idempotency_key='runtime-signal:' /);
  assert.match(sql,/new\.event_type = 'scan_submitted'/);
  assert.match(sql,/revoke all on function public\.powerhouse_open_cycle_from_runtime_signal_v1\(uuid\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_open_cycle_from_runtime_signal_v1\(uuid\) to service_role/i);
  assert.doesNotMatch(sql,/create\s+(?:table|schedule|publication|function)\s+\w*heartbeat/i);
});

test('privileged runtime-cycle function denies browser roles and keeps service-role execution',async()=>{
  const sql=await readFile(new URL('../supabase/migrations/20261009185500_bedrijfslek_runtime_signal_cycle_v1.sql',import.meta.url),'utf8');
  assert.match(sql,/revoke all on function public\.powerhouse_open_cycle_from_runtime_signal_v1\(uuid\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_open_cycle_from_runtime_signal_v1\(uuid\) to service_role/i);
  assert.match(sql,/e\.source not in \('website\.frisse_blik','website\.workshop_scan','website\.bedrijfslek'\)/);
  assert.match(sql,/on conflict \(tenant_id,cycle_id\)/i);
});

test('verified scan receipt offers a direct same-origin portal claim path',async()=>{
  const scan=await readFile(new URL('../zelfscan.html',import.meta.url),'utf8');
  const claim=await readFile(new URL('../portal-v2/scan-claim-bridge.js',import.meta.url),'utf8');
  assert.match(scan,/if\(!r\.ok\|\|data\.ok!==true\|\|!data\.scan_id\|\|!data\.event_id\)/);
  assert.match(scan,/sessionStorage\.setItem\('bg_last_scan_ref',key\)/);
  assert.match(scan,/link\.href='https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/'/);
  assert.match(scan,/status\.appendChild\(link\)/);
  assert.match(claim,/const KEY='bg_last_scan_ref'/);
  assert.match(claim,/const submissionKey=pendingKey\(storage\)/);
});
