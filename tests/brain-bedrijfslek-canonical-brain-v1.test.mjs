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
  assert.match(s,/onConflict:'submission_key',ignoreDuplicates:true/);
  assert.match(s,/x-bg-service-token/);
});
test('selfscan shows full free value before async persistence and never submits contact PII',async()=>{
  const s=await readFile(new URL('../zelfscan.html',import.meta.url),'utf8');
  assert.match(s,/toon\('s-score'\);\s*bgScanNaarBrein\(score,per\)/);
  assert.match(s,/fetch\('\/api\/powerhouse-scan-ingest'/);
  assert.match(s,/BG_SCAN_KEY=bgMaakScanKey\(\)/);
  assert.match(s,/id="bgBrainStatus"/);
  assert.doesNotMatch(s,/function bgScanNaarBrein\([\s\S]*?\n}\s*\nvar TEAMUITDAGING[\s\S]*?\n/gi, /dummy/);
});
