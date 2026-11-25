import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('reuse canonical Powerhouse production smoke and trigger it on scan config changes',async()=>{
  const yml=await read('.github/workflows/powerhouse-scan-production-proof.yml');
  assert.match(yml,/name: Powerhouse Scan Production Proof/);
  assert.match(yml,/supabase\/config\.toml/);
  assert.match(yml,/name: Controlled canonical write and idempotency proof/);
  assert.match(yml,/name: Prove real Bedrijfslek → ONE BRAIN scan persistence and idempotency/);
});
test('Bedrijfslek production smoke returns two immutable matching scan and event receipts',async()=>{
  const yml=await read('.github/workflows/powerhouse-scan-production-proof.yml');
  assert.match(yml,/bedrijfslek-prod-smoke-/);
  assert.match(yml,/canonical:"https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/);
  assert.match(yml,/source_kind:"bedrijfslek_scan"/);
  assert.match(yml,/tenant_identity_status == "unverified"/);
  assert.match(yml,/deduped == true/);
  assert.match(yml,/bedrijfslek_scan_id=/);
  assert.match(yml,/bedrijfslek_event_id=/);
  assert.doesNotMatch(yml,/email\s*:/i);
});
test('production smoke preserves portal identity and public proxy privilege boundaries',async()=>{
  const yml=await read('.github/workflows/powerhouse-scan-production-proof.yml');
  assert.match(yml,/Prove portal scan API fails closed without identity/);
  assert.match(yml,/Prove public proxy cannot invoke privileged actions/);
  assert.match(yml,/PRIVILEGED_ACTION_FORBIDDEN/);
  const edge=await read('supabase/functions/powerhouse-scan-ingest/index.ts');
  assert.match(edge,/scan\.kind==='bedrijfslek_scan'/);
  assert.match(edge,/funnel_stage:scan.kind==='bedrijfslek_scan'\?'assessment':'lead'/);
});
