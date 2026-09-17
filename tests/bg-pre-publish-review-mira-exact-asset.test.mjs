import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const sourcePath = 'supabase/functions/bg-pre-publish-review/index.ts';

function source() {
  assert.ok(existsSync(sourcePath), `${sourcePath} must be source-controlled`);
  return readFileSync(sourcePath, 'utf8');
}

test('Instagram Mira gate is bound to the exact final asset and proof lineage', () => {
  const text = source();

  for (const required of [
    'MIRA_GATE_VERDICT_REQUIRED',
    'MIRA_GATE_ASSET_URL_REQUIRED',
    'MIRA_GATE_ASSET_MISMATCH',
    'MIRA_GATE_EVIDENCE_REF_REQUIRED',
    'MIRA_GATE_VERIFIED_AT_REQUIRED',
    'MIRA_GATE_VERIFICATION_STALE',
    'MIRA_OPENART_HISTORY_REQUIRED',
    'mira_gate_asset_url',
    'mira_gate_evidence_ref',
    'mira_gate_verified_at',
    'openart_history_id',
  ]) {
    assert.equal(text.includes(required), true, `missing exact-asset Mira contract marker: ${required}`);
  }

  assert.match(text, /clean\(body\.mira_gate_asset_url\)===clean\(body\.media_url\)/);
  assert.match(text, /clean\(body\.mira_gate_verdict\)\.toUpperCase\(\)==='PASS'/);
});

test('bare Mira boolean can never be the sole publication proof', () => {
  const text = source();
  const instagramBlock = text.slice(text.indexOf("if(channel==='instagram_company')"), text.indexOf("if(channel==='instagram_personal')"));

  assert.ok(instagramBlock.includes('body.mira_gate_passed!==true'), 'boolean remains a necessary compatibility signal');
  assert.ok(instagramBlock.includes('mira_gate_asset_url'), 'exact asset binding is mandatory');
  assert.ok(instagramBlock.includes('mira_gate_evidence_ref'), 'proof reference is mandatory');
  assert.ok(instagramBlock.includes('mira_gate_verified_at'), 'proof freshness is mandatory');
  assert.ok(instagramBlock.includes('mira_gate_verdict'), 'explicit PASS verdict is mandatory');
});
